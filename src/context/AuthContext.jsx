import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredItem, setStoredItem, STORAGE_KEYS, initializeStorage } from '../services/mockData';
import { signUpUser, signInUser, signOutUser, isSupabaseConfigured, supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseActive, setSupabaseActive] = useState(false);

  useEffect(() => {
    initializeStorage();
    setSupabaseActive(isSupabaseConfigured());
    
    // Restore persistent session from local storage on app startup
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
    const users = getStoredItem(STORAGE_KEYS.USERS, []);

    // Check if account already exists
    const existingUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return { success: false, error: 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.' };
    }

    let newUser = null;

    // 1. Register via Supabase Auth
    if (isSupabaseConfigured()) {
      const supaRes = await signUpUser({ ...userData, email: cleanEmail, password: cleanPassword });
      if (supaRes.success && supaRes.user) {
        newUser = { ...supaRes.user, password: cleanPassword };
      }
    }

    // 2. Fallback persistent user object if offline or Supabase unconfirmed
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
        gear: []
      };
    }

    // Persist permanently in stored users and active user session
    const updatedUsers = [newUser, ...users.filter(u => !u.email || u.email.toLowerCase() !== cleanEmail)];
    setStoredItem(STORAGE_KEYS.USERS, updatedUsers);
    setStoredItem(STORAGE_KEYS.CURRENT_USER, newUser);
    setCurrentUser(newUser);

    // Attempt profile save in Supabase database
    try {
      if (isSupabaseConfigured() && newUser.id) {
        await supabase.from('profiles').upsert({
          id: newUser.id,
          username: newUser.name,
          full_name: newUser.name,
          bio: `Membre ${newUser.role} sur StageLink`,
          skills: [newUser.role],
          is_premium: false,
          verified_badge: 'none'
        }, { onConflict: 'id' });
      }
    } catch (pe) {
      console.warn('Supabase profile persistence note:', pe?.message || pe);
    }

    return { success: true, user: newUser };
  };

  const logout = async () => {
    await signOutUser();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
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

    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { updatedUser } }));
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, loading, login, signup, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
