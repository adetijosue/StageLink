import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredItem, setStoredItem, STORAGE_KEYS, initializeStorage } from '../services/mockData';
import { signUpUser, signInUser, signOutUser, isSupabaseConfigured, supabase, safeUploadToStorage } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseActive, setSupabaseActive] = useState(false);

  // Helper to normalize user object from Supabase profile row
  const buildUserFromProfile = (profile, fallbackUser = {}) => {
    const ensureArray = (val) => Array.isArray(val) ? val : [];
    return {
      id: profile?.id || fallbackUser.id,
      email: profile?.email || fallbackUser.email || '',
      name: profile?.full_name || fallbackUser.name || 'Artiste StageLink',
      role: profile?.role || fallbackUser.role || 'Beatmaker / Compositeur',
      gender: profile?.gender || fallbackUser.gender || 'male',
      avatar: profile?.avatar_url || fallbackUser.avatar || '',
      coverPhoto: profile?.cover_url || fallbackUser.coverPhoto || '',
      bio: profile?.bio || fallbackUser.bio || `Membre ${profile?.role || fallbackUser.role || 'Artiste'} sur StageLink`,
      location: profile?.location || fallbackUser.location || '',
      verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue' || fallbackUser.verified,
      badgeType: profile?.verified_badge || fallbackUser.badgeType || 'none',
      company: profile?.company || fallbackUser.company || '',
      instruments: ensureArray(profile?.instruments || fallbackUser.instruments),
      genres: ensureArray(profile?.genres || fallbackUser.genres),
      gear: ensureArray(profile?.gear || fallbackUser.gear),
      isNewRegistration: fallbackUser.isNewRegistration || false
    };
  };

  useEffect(() => {
    initializeStorage();
    setSupabaseActive(isSupabaseConfigured());
    
    // 1. Initial restore from local storage
    const savedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
    let activeUser = savedUser;

    if (savedUser) {
      const users = getStoredItem(STORAGE_KEYS.USERS, []);
      const latestUser = users.find(u => 
        (u.id && savedUser.id && u.id === savedUser.id) ||
        (u.email && savedUser.email && u.email.toLowerCase() === savedUser.email.toLowerCase())
      );
      activeUser = { ...(latestUser || savedUser) };
      const ensureArray = (val) => Array.isArray(val) ? val : [];
      activeUser.instruments = ensureArray(activeUser.instruments);
      activeUser.genres = ensureArray(activeUser.genres);
      activeUser.gear = ensureArray(activeUser.gear);

      setCurrentUser(activeUser);
      setStoredItem(STORAGE_KEYS.CURRENT_USER, activeUser);
    }

    // 2. Fetch authoritative profile from Supabase Database on startup
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const targetId = session?.user?.id || activeUser?.id;
        if (targetId) {
          supabase.from('profiles').select('*').eq('id', targetId).maybeSingle().then(({ data: profile, error }) => {
            if (profile && !error) {
              const freshUser = buildUserFromProfile(profile, activeUser || {});
              setCurrentUser(freshUser);
              setStoredItem(STORAGE_KEYS.CURRENT_USER, freshUser);
            }
          });
        }
      });
    }

    // 3. Subscribe to Supabase Auth State Changes & Token Refreshes
    let authListener;
    if (isSupabaseConfigured()) {
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          return;
        }
        if (session?.user) {
          supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data: profile }) => {
            const u = buildUserFromProfile(profile, {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name,
              role: session.user.user_metadata?.role
            });
            setCurrentUser(u);
            setStoredItem(STORAGE_KEYS.CURRENT_USER, u);
          });
        }
      });
      authListener = listener;
    }

    setLoading(false);

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Try Supabase Auth First
    if (isSupabaseConfigured()) {
      const supaRes = await signInUser({ email: cleanEmail, password: cleanPassword });
      if (supaRes.success && supaRes.user) {
        const safeUser = { ...supaRes.user };
        const users = getStoredItem(STORAGE_KEYS.USERS, []);
        const updatedUsers = [safeUser, ...users.filter(u => !u.email || u.email.toLowerCase() !== cleanEmail)];
        
        setStoredItem(STORAGE_KEYS.USERS, updatedUsers);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, safeUser);
        setCurrentUser(safeUser);
        return { success: true, user: safeUser };
      } else if (supaRes.error) {
        return { success: false, error: supaRes.error };
      }
    }

    // 2. Fallback to Local Persistent User Records
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const foundUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (foundUser) {
      if (!foundUser.password || foundUser.password === cleanPassword) {
        setCurrentUser(foundUser);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, foundUser);
        return { success: true, user: foundUser };
      } else {
        return { success: false, error: 'Mot de passe incorrect.' };
      }
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
        const updatedUsers = [newUser, ...users.filter(u => !u.email || u.email.toLowerCase() !== cleanEmail)];
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
    await signOutUser();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
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

    // 3. Clear current user session & logout
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    await signOutUser();

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

    // If avatar or cover is a base64 DataURL, upload it to storage so it's a permanent HTTPS URL
    if (sanitizedFields.avatar && typeof sanitizedFields.avatar === 'string' && sanitizedFields.avatar.startsWith('data:image')) {
      try {
        const publicAvatar = await safeUploadToStorage('chat_media', `avatar_${currentUser.id}_${Date.now()}`, sanitizedFields.avatar);
        if (publicAvatar) sanitizedFields.avatar = publicAvatar;
      } catch (e) {
        console.warn('Avatar upload to storage note:', e);
      }
    }

    if (sanitizedFields.coverPhoto && typeof sanitizedFields.coverPhoto === 'string' && sanitizedFields.coverPhoto.startsWith('data:image')) {
      try {
        const publicCover = await safeUploadToStorage('chat_media', `cover_${currentUser.id}_${Date.now()}`, sanitizedFields.coverPhoto);
        if (publicCover) sanitizedFields.coverPhoto = publicCover;
      } catch (e) {
        console.warn('Cover upload to storage note:', e);
      }
    }

    const updatedUser = { ...currentUser, ...sanitizedFields };
    setCurrentUser(updatedUser);
    setStoredItem(STORAGE_KEYS.CURRENT_USER, updatedUser);

    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    if (!updatedUsers.some(u => u.id === currentUser.id)) {
      updatedUsers.unshift(updatedUser);
    }
    setStoredItem(STORAGE_KEYS.USERS, updatedUsers);

    // Save profile modifications directly to Supabase Database with resilient update/upsert
    if (isSupabaseConfigured() && currentUser.id) {
      try {
        const payload = {
          id: currentUser.id,
          email: currentUser.email || `${currentUser.id}@stagelink.app`,
          full_name: sanitizedFields.name !== undefined ? sanitizedFields.name : (currentUser.name || 'Artiste StageLink'),
          role: sanitizedFields.role !== undefined ? sanitizedFields.role : (currentUser.role || 'Beatmaker / Compositeur'),
          updated_at: new Date().toISOString()
        };
        if (sanitizedFields.gender !== undefined) payload.gender = sanitizedFields.gender;
        if (sanitizedFields.avatar !== undefined) payload.avatar_url = sanitizedFields.avatar;
        if (sanitizedFields.coverPhoto !== undefined) payload.cover_url = sanitizedFields.coverPhoto;
        if (sanitizedFields.bio !== undefined) payload.bio = sanitizedFields.bio;
        if (sanitizedFields.location !== undefined) payload.location = sanitizedFields.location;
        if (sanitizedFields.company !== undefined) payload.company = sanitizedFields.company;
        if (sanitizedFields.verified !== undefined) payload.verified_badge = sanitizedFields.verified ? (sanitizedFields.badgeType || 'gold') : 'none';
        if (sanitizedFields.badgeType !== undefined) payload.verified_badge = sanitizedFields.badgeType;
        if (sanitizedFields.instruments !== undefined) payload.instruments = sanitizedFields.instruments;
        if (sanitizedFields.genres !== undefined) payload.genres = sanitizedFields.genres;
        if (sanitizedFields.gear !== undefined) payload.gear = sanitizedFields.gear;

        const { error: updateErr } = await supabase.from('profiles').update(payload).eq('id', currentUser.id);
        if (updateErr) {
          const { error: upsertErr } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
          if (upsertErr) {
            console.error('Failed to upsert profile to Supabase:', upsertErr);
          }
        }
      } catch (pe) {
        console.warn('Supabase profile sync note:', pe?.message || pe);
      }
    }

    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { updatedUser } }));
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, loading, supabaseActive, login, signup, logout, deleteUserAccount, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

