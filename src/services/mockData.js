/**
 * StageLink Mock Database & Persistence Engine
 * 100% Music Industry Roles, Musician Specialties, and Creative Opportunities.
 */

const STORAGE_KEYS = {
  USERS: 'stagelink_users_db',
  CURRENT_USER: 'stagelink_current_user',
  POSTS: 'stagelink_posts',
  STORIES: 'stagelink_stories',
  MATCHES: 'stagelink_matches',
  CHATS: 'stagelink_chats',
  MUSIC_PROJECTS: 'stagelink_music_projects'
};

// Clean Virgin Database Seeds for Real Production Users
const INITIAL_USERS = [];
const INITIAL_STORIES = [];
const INITIAL_POSTS = [];
const INITIAL_SWIPE_MATCHES = [];
const INITIAL_CHATS = [];

// Local Storage Helper Functions with Quota Protection
export const getStoredItem = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.warn(`Reading ${key} fallback:`, e.message);
    return fallback;
  }
};

export const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Storage Quota note for ${key}:`, e.message);
    // Prune large Data URL media if storage quota is reached
    try {
      if (Array.isArray(value)) {
        const pruned = value.map(item => {
          if (item.video && item.video.startsWith('data:')) {
            return { ...item, video: null };
          }
          if (item.image && item.image.startsWith('data:')) {
            return { ...item, image: null };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(pruned));
      }
    } catch (innerErr) {
      console.warn('Pruned storage save note:', innerErr.message);
    }
  }
};

// ═══════════════════════════════════════════════════════════
// DATA VERSION — Increment this number to force a full 
// localStorage reset on all users' browsers on next visit.
// This ensures stale phantom data from previous sessions
// is cleared for the Supabase production launch.
// ═══════════════════════════════════════════════════════════
const STAGELINK_DATA_VERSION = 2;
const DATA_VERSION_KEY = 'stagelink_data_version';

export const initializeStorage = () => {
  // Check if a full reset is needed (version bump or first launch)
  const currentVersion = parseInt(localStorage.getItem(DATA_VERSION_KEY) || '0', 10);
  
  if (currentVersion < STAGELINK_DATA_VERSION) {
    // Full purge of all StageLink localStorage data
    console.log(`[StageLink] 🔄 Data reset: v${currentVersion} → v${STAGELINK_DATA_VERSION}`);
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any stale welcome/onboarding flags
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('stagelink_') || key.startsWith('sl_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Set new version marker
    localStorage.setItem(DATA_VERSION_KEY, String(STAGELINK_DATA_VERSION));
  }

  // Initialize empty seed data if not present
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStoredItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    setStoredItem(STORAGE_KEYS.POSTS, INITIAL_POSTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STORIES)) {
    setStoredItem(STORAGE_KEYS.STORIES, INITIAL_STORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
    setStoredItem(STORAGE_KEYS.MATCHES, INITIAL_SWIPE_MATCHES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
    setStoredItem(STORAGE_KEYS.CHATS, INITIAL_CHATS);
  }
};

export { STORAGE_KEYS };
