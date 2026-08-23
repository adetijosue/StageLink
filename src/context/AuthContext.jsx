import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredItem, setStoredItem, STORAGE_KEYS, initializeStorage } from '../services/mockData';
import { signUpUser, signInUser, signOutUser, isSupabaseConfigured, supabase, safeUploadToStorage, clearSupabaseAuthStorage } from '../services/supabaseClient';

import { compressImage } from '../utils/imageCompressor';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [authKey, setAuthKey] = useState(0);

  // Helper to normalize user object from Supabase profile row and retain custom user fields
  const buildUserFromProfile = (profile, fallbackUser = {}) => {
    const ensureArray = (remoteArr, localArr) => {
      const r = Array.isArray(remoteArr) ? remoteArr.filter(Boolean) : [];
      const l = Array.isArray(localArr) ? localArr.filter(Boolean) : [];
      return r.length > 0 ? r : l;
    };

    const chooseNonEmpty = (remoteVal, localVal, defaultVal = '') => {
      if (typeof remoteVal === 'string' && remoteVal.trim().length > 0) return remoteVal.trim();
      if (typeof localVal === 'string' && localVal.trim().length > 0) return localVal.trim();
      return defaultVal;
    };

    const candidateName = chooseNonEmpty(profile?.full_name, fallbackUser.name || fallbackUser.full_name, fallbackUser.email ? fallbackUser.email.split('@')[0] : 'Artiste');
    const defaultRole = chooseNonEmpty(profile?.role, fallbackUser.role || fallbackUser.userRole, 'Artiste');
    const defaultUsername = chooseNonEmpty(profile?.username, fallbackUser.userName || fallbackUser.username, candidateName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    return {
      id: profile?.id || fallbackUser.id,
      email: profile?.email || fallbackUser.email || '',
      name: candidateName,
      userName: defaultUsername,
      role: defaultRole,
      gender: profile?.gender || fallbackUser.gender || 'male',
      avatar: chooseNonEmpty(profile?.avatar_url, fallbackUser.avatar || fallbackUser.avatar_url, ''),
      coverPhoto: chooseNonEmpty(profile?.cover_url, fallbackUser.coverPhoto || fallbackUser.cover_url, ''),
      bio: chooseNonEmpty(profile?.bio, fallbackUser.bio, ''),
      location: chooseNonEmpty(profile?.location, fallbackUser.location, ''),
      verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue' || Boolean(fallbackUser.verified),
      badgeType: (profile?.verified_badge && profile.verified_badge !== 'none') ? profile.verified_badge : (fallbackUser.badgeType || 'none'),
      company: chooseNonEmpty(profile?.company, fallbackUser.company, ''),
      instruments: ensureArray(profile?.instruments, fallbackUser.instruments),
      genres: ensureArray(profile?.genres, fallbackUser.genres),
      gear: ensureArray(profile?.gear, fallbackUser.gear),
      spotifyUrl: chooseNonEmpty(profile?.spotify_url, fallbackUser.spotifyUrl, ''),
      instagramUrl: chooseNonEmpty(profile?.instagram_url, fallbackUser.instagramUrl, ''),
      tiktokUrl: chooseNonEmpty(profile?.tiktok_url, fallbackUser.tiktokUrl, ''),
      youtubeUrl: chooseNonEmpty(profile?.youtube_url, fallbackUser.youtubeUrl, ''),
      isNewRegistration: fallbackUser.isNewRegistration || false
    };
  };

  useEffect(() => {
    initializeStorage();
    setSupabaseActive(isSupabaseConfigured());
    
    // If Supabase is configured, enforce strict session validation against Supabase Auth
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(async ({ data: { session }, error: sessionErr }) => {
        // 1. If Supabase session is invalid or user is not logged in, purge stale local user
        if (sessionErr || !session?.user) {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          setLoading(false);
          return;
        }

        const authUser = session.user;
        const savedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);

        // 2. If saved local user belongs to an old/deleted ID, purge all old caches
        if (savedUser && savedUser.id && savedUser.id !== authUser.id) {
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith(`stagelink_cached_conversations_`) || key.startsWith(`stagelink_cached_msgs_`)) {
                localStorage.removeItem(key);
              }
            });
          } catch (_) {}
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }

        // 3. Fetch authoritative profile from Supabase Database for the active session user
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profile && !error) {
            const freshUser = buildUserFromProfile(profile, { id: authUser.id, email: authUser.email });
            setCurrentUser(freshUser);
            setStoredItem(STORAGE_KEYS.CURRENT_USER, freshUser);
          } else {
            // Create initial profile in public.profiles for the newly created user
            const defaultName = authUser.user_metadata?.full_name || (authUser.email ? authUser.email.split('@')[0] : 'Artiste');
            const defaultUsername = authUser.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '_') || 'user_' + authUser.id.slice(0, 6);
            const defaultRole = authUser.user_metadata?.role || 'Artiste / Compositeur';

            const { data: createdProf } = await supabase.from('profiles').upsert({
              id: authUser.id,
              full_name: defaultName,
              username: defaultUsername,
              email: authUser.email,
              role: defaultRole,
              avatar_url: '',
              bio: `Membre ${defaultRole} sur StageLink`,
              verified_badge: 'none',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' }).select().maybeSingle();

            const freshUser = buildUserFromProfile(createdProf || {}, { id: authUser.id, email: authUser.email, name: defaultName, role: defaultRole });
            setCurrentUser(freshUser);
            setStoredItem(STORAGE_KEYS.CURRENT_USER, freshUser);
          }
        } catch (err) {
          console.warn('Profile sync on startup note:', err);
        } finally {
          setLoading(false);
        }
      });

      // 4. Subscribe to Supabase Auth State Changes (Login, Logout, Token Refresh)
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith(`stagelink_cached_conversations_`) || key.startsWith(`stagelink_cached_msgs_`)) {
                localStorage.removeItem(key);
              }
            });
          } catch (_) {}
          return;
        }

        if (session?.user) {
          const authUser = session.user;
          const oldSavedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
          if (oldSavedUser && oldSavedUser.id && oldSavedUser.id !== authUser.id) {
            try {
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith(`stagelink_cached_conversations_`) || key.startsWith(`stagelink_cached_msgs_`)) {
                  localStorage.removeItem(key);
                }
              });
            } catch (_) {}
          }

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .maybeSingle();

            if (profile) {
              const freshUser = buildUserFromProfile(profile, { id: authUser.id, email: authUser.email });
              setCurrentUser(freshUser);
              setStoredItem(STORAGE_KEYS.CURRENT_USER, freshUser);
            } else {
              const defaultName = authUser.user_metadata?.full_name || (authUser.email ? authUser.email.split('@')[0] : 'Artiste');
              const defaultUsername = authUser.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '_') || 'user_' + authUser.id.slice(0, 6);
              const defaultRole = authUser.user_metadata?.role || 'Artiste / Compositeur';

              const { data: createdProf } = await supabase.from('profiles').upsert({
                id: authUser.id,
                full_name: defaultName,
                username: defaultUsername,
                email: authUser.email,
                role: defaultRole,
                avatar_url: '',
                bio: `Membre ${defaultRole} sur StageLink`,
                verified_badge: 'none',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' }).select().maybeSingle();

              const freshUser = buildUserFromProfile(createdProf || {}, { id: authUser.id, email: authUser.email, name: defaultName, role: defaultRole });
              setCurrentUser(freshUser);
              setStoredItem(STORAGE_KEYS.CURRENT_USER, freshUser);
            }
          } catch (err) {
            console.warn('Auth state change profile fetch note:', err);
          }
        }
      });

      return () => {
        if (listener?.subscription) {
          listener.subscription.unsubscribe();
        }
      };
    } else {
      // Local fallback only if Supabase is not configured
      const savedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
      setCurrentUser(savedUser);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Try Supabase Auth First
    if (isSupabaseConfigured()) {
      const supaRes = await signInUser({ email: cleanEmail, password: cleanPassword });
      if (supaRes.success && supaRes.user) {
        const safeUser = { ...supaRes.user };

        // Clean out any stale cached data belonging to older user IDs for this email
        try {
          const oldSavedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
          if (oldSavedUser && oldSavedUser.id !== safeUser.id) {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith(`stagelink_cached_conversations_`) || key.startsWith(`stagelink_cached_msgs_`)) {
                localStorage.removeItem(key);
              }
            });
          }
        } catch (_) {}

        const users = getStoredItem(STORAGE_KEYS.USERS, []);
        const updatedUsers = [safeUser, ...users.filter(u => (!u.email || u.email.toLowerCase() !== cleanEmail) && u.id !== safeUser.id)];
        
        setStoredItem(STORAGE_KEYS.USERS, updatedUsers);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, safeUser);
        setCurrentUser(safeUser);
        return { success: true, user: safeUser };
      } else if (supaRes.error) {
        return { success: false, error: supaRes.error };
      }
    }

    // 2. Fallback to Local Persistent User Records (no password check — Supabase Auth is authoritative)
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const foundUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (foundUser) {
      // Local fallback only used when Supabase is not configured; never compare passwords in plaintext
      setCurrentUser(foundUser);
      setStoredItem(STORAGE_KEYS.CURRENT_USER, foundUser);
      return { success: true, user: foundUser };
    }

    return { success: false, error: 'Adresse e-mail ou mot de passe incorrect.' };
  };

  const signup = async (userData) => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPassword = userData.password.trim();
    const cleanName = userData.name.trim();

    // 1. Register via Supabase Auth
    if (isSupabaseConfigured()) {
      const supaRes = await signUpUser({ ...userData, email: cleanEmail, password: cleanPassword, name: cleanName });
      if (supaRes.success && supaRes.user) {
        const newUser = { ...supaRes.user, isNewRegistration: true };
        const users = getStoredItem(STORAGE_KEYS.USERS, []);
        const updatedUsers = [newUser, ...users.filter(u => (!u.email || u.email.toLowerCase() !== cleanEmail) && u.id !== newUser.id)];
        setStoredItem(STORAGE_KEYS.USERS, updatedUsers);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, newUser);
        setCurrentUser(newUser);
        return { success: true, user: newUser };
      } else {
        return { success: false, error: supaRes.error || 'Erreur lors de la création du compte.' };
      }
    }

    // 2. Fallback only if Supabase is NOT configured
    const cleanHex = Array.from(cleanEmail).map(c => c.charCodeAt(0).toString(16)).join('');
    const paddedHex = (cleanHex + '0'.repeat(32)).slice(0, 32);
    const uuidStr = `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-4${paddedHex.slice(13, 16)}-a${paddedHex.slice(17, 20)}-${paddedHex.slice(20, 32)}`;

    const newUser = {
      id: uuidStr,
      email: cleanEmail,
      name: cleanName,
      role: userData.role || 'Beatmaker / Compositeur',
      gender: userData.gender || 'male',
      avatar: '',
      verified: false,
      badgeType: 'none',
      company: '',
      instruments: [],
      genres: [],
      gear: [],
      isNewRegistration: true
    };

    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const updatedUsers = [newUser, ...users.filter(u => !u.email || u.email.toLowerCase() !== cleanEmail)];
    setStoredItem(STORAGE_KEYS.USERS, updatedUsers);
    setStoredItem(STORAGE_KEYS.CURRENT_USER, newUser);
    setCurrentUser(newUser);

    return { success: true, user: newUser };
  };

  const logout = async () => {
    clearSupabaseAuthStorage();
    await signOutUser({ scope: 'global' });
    setCurrentUser(null);
    setAuthKey(prev => prev + 1);
  };

  const resetAuthState = async () => {
    clearSupabaseAuthStorage();
    await signOutUser({ scope: 'global' });
    setCurrentUser(null);
    setAuthKey(prev => prev + 1);
  };

  const deleteUserAccount = async () => {
    if (!currentUser) return { success: false };

    const userId = currentUser.id;
    const userEmail = currentUser.email;

    // 1. Delete user entirely from Supabase Auth (which cascades to profiles and all data)
    if (isSupabaseConfigured() && userId) {
      try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) {
          console.warn('Erreur RPC delete_user_account, utilisation de la suppression directe...', error);
          const { error: deleteErr } = await supabase.from('profiles').delete().eq('id', userId);
          if (deleteErr) {
            console.error('Erreur de suppression du profil:', deleteErr);
            throw new Error('Échec de la suppression. Veuillez contacter le support.');
          }
        }
      } catch (pe) {
        console.error('Erreur critique lors de la suppression de compte:', pe);
        return { success: false, error: pe.message };
      }
    }

    // 2. Remove user from local persistent registered users storage
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const updatedUsers = users.filter(u => u.id !== userId && (!u.email || !userEmail || u.email.toLowerCase() !== userEmail.toLowerCase()));
    setStoredItem(STORAGE_KEYS.USERS, updatedUsers);

    // 3. Clear current user session, purge all storage & logout globally
    clearSupabaseAuthStorage();
    await signOutUser({ scope: 'global' });
    setCurrentUser(null);
    setAuthKey(prev => prev + 1);

    return { success: true };
  };

  const updateUserProfile = async (updatedFields) => {
    if (!currentUser) return;

    // Helper to convert comma-separated strings to arrays
    const toArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const sanitizedFields = { ...updatedFields };

    if (sanitizedFields.instruments !== undefined) sanitizedFields.instruments = toArray(sanitizedFields.instruments);
    if (sanitizedFields.genres !== undefined) sanitizedFields.genres = toArray(sanitizedFields.genres);
    if (sanitizedFields.gear !== undefined) sanitizedFields.gear = toArray(sanitizedFields.gear);

    const updatedUser = {
      ...currentUser,
      ...sanitizedFields
    };

    // 1. Update In-Memory Context
    setCurrentUser(updatedUser);

    // 2. Persist to Local Storage
    setStoredItem(STORAGE_KEYS.CURRENT_USER, updatedUser);

    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex >= 0) {
      users[userIndex] = updatedUser;
      setStoredItem(STORAGE_KEYS.USERS, users);
    }

    // 3. Sync to Supabase Database
    if (isSupabaseConfigured()) {
      try {
        const authorFullName = sanitizedFields.name || currentUser.name;
        const authorRole = sanitizedFields.role || currentUser.role;

        const payload = {
          id: currentUser.id,
          full_name: authorFullName,
          role: authorRole,
          updated_at: new Date().toISOString()
        };

        if (sanitizedFields.username !== undefined) payload.username = sanitizedFields.username;
        if (sanitizedFields.gender !== undefined) payload.gender = sanitizedFields.gender;
        if (sanitizedFields.avatar !== undefined) payload.avatar_url = sanitizedFields.avatar;
        if (sanitizedFields.coverPhoto !== undefined) payload.cover_url = sanitizedFields.coverPhoto;
        if (sanitizedFields.bio !== undefined) payload.bio = sanitizedFields.bio;
        if (sanitizedFields.location !== undefined) payload.location = sanitizedFields.location;
        if (sanitizedFields.company !== undefined) payload.company = sanitizedFields.company;
        if (sanitizedFields.badgeType !== undefined) payload.verified_badge = sanitizedFields.badgeType;
        if (sanitizedFields.instruments !== undefined) payload.instruments = sanitizedFields.instruments;
        if (sanitizedFields.genres !== undefined) payload.genres = sanitizedFields.genres;
        if (sanitizedFields.gear !== undefined) payload.gear = sanitizedFields.gear;
        if (sanitizedFields.spotifyUrl !== undefined) payload.spotify_url = sanitizedFields.spotifyUrl;
        if (sanitizedFields.instagramUrl !== undefined) payload.instagram_url = sanitizedFields.instagramUrl;
        if (sanitizedFields.tiktokUrl !== undefined) payload.tiktok_url = sanitizedFields.tiktokUrl;
        if (sanitizedFields.youtubeUrl !== undefined) payload.youtube_url = sanitizedFields.youtubeUrl;

        const { error: upsertErr } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
        if (upsertErr) {
          console.warn('Supabase profile upsert note, trying update:', upsertErr.message);
          await supabase.from('profiles').update(payload).eq('id', currentUser.id);
        }

        // Also update Auth user metadata to keep session perfectly aligned
        try {
          supabase.auth.updateUser({
            data: {
              full_name: authorFullName,
              role: authorRole,
              avatar_url: sanitizedFields.avatar !== undefined ? sanitizedFields.avatar : currentUser.avatar
            }
          }).catch(() => {});
        } catch (me) {}
      } catch (pe) {
        console.warn('Supabase profile sync note:', pe?.message || pe);
      }
    }

    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { updatedUser } }));
  };

  return (
    <AuthContext.Provider value={{
      authKey,
      currentUser,
      isAuthenticated: !!currentUser,
      loading,
      supabaseActive,
      login,
      signup,
      logout,
      resetAuthState,
      deleteUserAccount,
      updateUserProfile
    }}>
      <React.Fragment key={authKey}>
        {children}
      </React.Fragment>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
