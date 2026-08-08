import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredItem, setStoredItem, STORAGE_KEYS, initializeStorage } from '../services/mockData';
import { signUpUser, signInUser, signOutUser, isSupabaseConfigured, supabase, getSupabaseSession, onAuthStateChange } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseActive, setSupabaseActive] = useState(false);

  useEffect(() => {
    initializeStorage();
    const configured = isSupabaseConfigured();
    setSupabaseActive(configured);

    const initAuth = async () => {
      // 1. Try to restore session from Supabase first
      if (configured) {
        try {
          const session = await getSupabaseSession();
          if (session?.user) {
            // We have an active Supabase session — fetch the profile
            let profile = null;
            try {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              profile = data;
            } catch (pe) {
              console.warn('[StageLink] Profile fetch on restore:', pe?.message);
            }

            const restoredUser = {
              id: session.user.id,
              email: session.user.email,
              name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Utilisateur',
              role: profile?.role || session.user.user_metadata?.role || 'Artiste',
              gender: profile?.gender || session.user.user_metadata?.gender || 'male',
              avatar: profile?.avatar_url || '',
              verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue',
              badgeType: profile?.verified_badge || 'none',
              company: profile?.company || '',
              bio: profile?.bio || '',
              location: profile?.location || '',
              instruments: Array.isArray(profile?.instruments) ? profile.instruments : [],
              genres: Array.isArray(profile?.genres) ? profile.genres : [],
              gear: Array.isArray(profile?.gear) ? profile.gear : []
            };

            // Merge with any locally stored password for offline compat
            const savedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
            if (savedUser?.password) {
              restoredUser.password = savedUser.password;
            }

            setCurrentUser(restoredUser);
            setStoredItem(STORAGE_KEYS.CURRENT_USER, restoredUser);

            // Also update the users list
            const users = getStoredItem(STORAGE_KEYS.USERS, []);
            const updatedUsers = [restoredUser, ...users.filter(u => u.id !== restoredUser.id)];
            setStoredItem(STORAGE_KEYS.USERS, updatedUsers);

            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[StageLink] Supabase session restore error:', err?.message);
        }
      }

      // 2. Fallback: restore from localStorage
      const savedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
      if (savedUser) {
        const users = getStoredItem(STORAGE_KEYS.USERS, []);
        const latestUser = users.find(u => 
          (u.id && savedUser.id && u.id === savedUser.id) ||
          (u.email && savedUser.email && u.email.toLowerCase() === savedUser.email.toLowerCase())
        );
        const activeUser = { ...(latestUser || savedUser) };

        const ensureArray = (val) => Array.isArray(val) ? val : [];
        activeUser.instruments = ensureArray(activeUser.instruments);
        activeUser.genres = ensureArray(activeUser.genres);
        activeUser.gear = ensureArray(activeUser.gear);

        setCurrentUser(activeUser);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, activeUser);
      }

      setLoading(false);
    };

    initAuth();

    // 3. Subscribe to auth state changes to keep session in sync
    let authSubscription = null;
    if (configured) {
      const { data } = onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
        // For SIGNED_IN / TOKEN_REFRESHED, we don't need to do anything
        // because the login/signup functions already handle setting the user
      });
      authSubscription = data?.subscription;
    }

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
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
        const userWithPass = { ...supaRes.user, password: cleanPassword };
        const users = getStoredItem(STORAGE_KEYS.USERS, []);
        const updatedUsers = [userWithPass, ...users.filter(u => !u.email || u.email.toLowerCase() !== cleanEmail)];
        
        setStoredItem(STORAGE_KEYS.USERS, updatedUsers);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, userWithPass);
        setCurrentUser(userWithPass);
        return { success: true, user: userWithPass };
      }
      // If Supabase login fails, return the error — don't fallback silently
      if (supaRes.error) {
        return { success: false, error: supaRes.error };
      }
    }

    // 2. Fallback to Local Persistent User Records (only if Supabase is not configured)
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

    let newUser = null;

    // 1. Register via Supabase Auth
    if (isSupabaseConfigured()) {
      const supaRes = await signUpUser({ ...userData, email: cleanEmail, password: cleanPassword, name: cleanName });
      if (supaRes.success && supaRes.user) {
        newUser = { ...supaRes.user, password: cleanPassword };
      } else if (supaRes.error) {
        const isNetworkErr = supaRes.error.includes('Failed to fetch') || 
                             supaRes.error.includes('réseau') || 
                             supaRes.error.includes('connexion') || 
                             supaRes.error.includes('anti-trackers');
        if (!isNetworkErr) {
          // Validation errors (email exists, short password, etc) -> Return to UI
          return { success: false, error: supaRes.error };
        }
        console.warn('[StageLink] Supabase network fetch error, activating local session fallback...');
      }
    }

    // 2. Fallback: create user locally if network/Supabase unavailable
    if (!newUser) {
      const cleanHex = Array.from(cleanEmail).map(c => c.charCodeAt(0).toString(16)).join('');
      const paddedHex = (cleanHex + '0'.repeat(32)).slice(0, 32);
      const uuidStr = `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-4${paddedHex.slice(13, 16)}-a${paddedHex.slice(17, 20)}-${paddedHex.slice(20, 32)}`;

      newUser = {
        id: uuidStr,
        email: cleanEmail,
        name: cleanName,
        role: userData.role || 'Beatmaker / Compositeur',
        gender: userData.gender || 'male',
        password: cleanPassword,
        avatar: '',
        verified: false,
        badgeType: 'none',
        company: '',
        instruments: [],
        genres: [],
        gear: [],
        isNewRegistration: true
      };
    } else {
      newUser.isNewRegistration = true;
    }

    // Persist permanently in stored users and active user session
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const updatedUsers = [newUser, ...users.filter(u => !u.email || u.email.toLowerCase() !== cleanEmail)];
    setStoredItem(STORAGE_KEYS.USERS, updatedUsers);
    setStoredItem(STORAGE_KEYS.CURRENT_USER, newUser);
    setCurrentUser(newUser);

    // Attempt profile upsert in Supabase (using ONLY valid production schema columns)
    try {
      if (isSupabaseConfigured() && newUser.id) {
        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: newUser.id,
          username: cleanName,
          full_name: cleanName,
          email: cleanEmail,
          bio: `Membre ${newUser.role} sur StageLink`,
          role: newUser.role || 'Artiste',
          gender: newUser.gender || 'male',
          verified_badge: 'none'
        }, { onConflict: 'id' });

        if (profileErr) {
          console.warn('[StageLink] Profile upsert in signup:', profileErr.message, profileErr.code);
        } else {
          console.log('[StageLink] ✅ Profile saved to Supabase for user:', newUser.id);
        }
      }
    } catch (pe) {
      console.warn('[StageLink] Supabase profile persistence exception:', pe?.message || pe);
    }

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

    // 1. Delete profile from Supabase Database table
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (pe) {
        console.warn('[StageLink] Supabase profile deletion:', pe?.message || pe);
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

  const updateUserProfile = (updatedFields) => {
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

    const updatedUser = { ...currentUser, ...sanitizedFields };
    setCurrentUser(updatedUser);
    setStoredItem(STORAGE_KEYS.CURRENT_USER, updatedUser);

    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    setStoredItem(STORAGE_KEYS.USERS, updatedUsers);

    // Also sync to Supabase profiles table
    if (isSupabaseConfigured() && currentUser.id) {
      const supaFields = {};
      if (sanitizedFields.name !== undefined) supaFields.full_name = sanitizedFields.name;
      if (sanitizedFields.avatar !== undefined) supaFields.avatar_url = sanitizedFields.avatar;
      if (sanitizedFields.bio !== undefined) supaFields.bio = sanitizedFields.bio;
      if (sanitizedFields.role !== undefined) supaFields.role = sanitizedFields.role;
      if (sanitizedFields.location !== undefined) supaFields.location = sanitizedFields.location;
      if (sanitizedFields.company !== undefined) supaFields.company = sanitizedFields.company;
      if (sanitizedFields.instruments !== undefined) supaFields.instruments = sanitizedFields.instruments;
      if (sanitizedFields.genres !== undefined) supaFields.genres = sanitizedFields.genres;
      if (sanitizedFields.gear !== undefined) supaFields.gear = sanitizedFields.gear;

      if (Object.keys(supaFields).length > 0) {
        supaFields.updated_at = new Date().toISOString();
        supabase.from('profiles').update(supaFields).eq('id', currentUser.id)
          .then(({ error }) => {
            if (error) console.warn('[StageLink] Profile sync to Supabase:', error.message);
            else console.log('[StageLink] ✅ Profile synced to Supabase');
          });
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
