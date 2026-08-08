import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredItem, setStoredItem, STORAGE_KEYS, initializeStorage } from '../services/mockData';
import { signUpUser, signInUser, signOutUser, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseActive, setSupabaseActive] = useState(false);

  useEffect(() => {
    initializeStorage();
    setSupabaseActive(isSupabaseConfigured());
    const savedUser = getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
    if (savedUser) {
      // Sync savedUser with latest profile and sanitize arrays rigorously
      const users = getStoredItem(STORAGE_KEYS.USERS, []);
      const latestUserInDb = users.find((u) => u.id === savedUser.id || (u.email && savedUser.email && u.email.toLowerCase() === savedUser.email.toLowerCase()));
      const activeUser = { ...(latestUserInDb || savedUser) };

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
    if (isSupabaseConfigured()) {
      const supaRes = await signInUser({ email, password });
      if (supaRes.success) {
        setCurrentUser(supaRes.user);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, supaRes.user);
        return { success: true, user: supaRes.user };
      }
      return { success: false, error: supaRes.error || 'Identifiants invalides.' };
    }
    return { success: false, error: 'Supabase n’est pas configuré.' };
  };

  const signup = async (userData) => {
    if (isSupabaseConfigured()) {
      const supaRes = await signUpUser(userData);
      if (supaRes.success) {
        setCurrentUser(supaRes.user);
        setStoredItem(STORAGE_KEYS.CURRENT_USER, supaRes.user);
        return { success: true, user: supaRes.user };
      }
      return { success: false, error: supaRes.error || 'Erreur lors de l’inscription.' };
    }
    return { success: false, error: 'Supabase n’est pas configuré.' };
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
