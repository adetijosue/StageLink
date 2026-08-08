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

// Empty Initial Seed Data for Production
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

// Initialize seed storage ONLY IF NOT ALREADY INITIALIZED (preserves user profile edits & custom avatar photos)
export const initializeStorage = () => {
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
