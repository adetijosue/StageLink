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
  MUSIC_PROJECTS: 'stagelink_music_projects',
  PRO_WORKS: 'stagelink_services_works',
  PRO_SERVICES: 'stagelink_services_list',
  PRO_COURSES: 'stagelink_services_courses',
  PRO_EVENTS: 'stagelink_services_events'
};

// Clean Virgin State for Production (Real Authenticated Supabase Users Only)
const INITIAL_USERS = [];

const INITIAL_STORIES = [];
const INITIAL_POSTS = [];
const INITIAL_SWIPE_MATCHES = [];
const INITIAL_CHATS = [];

// Helper to detect test/dummy artifacts & legacy mock accounts
export const isTestArtifact = (item) => {
  if (!item) return false;
  if (item.is_test === true || item.is_test_account === true) return true;
  const author = String(item.userName || item.authorName || item.user_name || item.name || '').toLowerCase().trim();
  const userId = String(item.userId || item.user_id || item.id || '').toLowerCase().trim();
  const content = String(item.text || item.content || item.caption || '').toLowerCase();
  
  if (
    userId.startsWith('artist_') ||
    userId.startsWith('mock_') ||
    userId.startsWith('dummy_') ||
    author === 'test subagent' ||
    author.includes('subagent') ||
    author === 'alexandre dubois' ||
    author === 'léa morel' ||
    author === 'lea morel' ||
    author === 'marcus chen' ||
    author === 'david koné' ||
    author === 'david kone' ||
    author === 'sofia rossi' ||
    author === 'sarah benali' ||
    userId === 'd0b0e7b9-648f-4d77-96a6-a527ae2b4939' ||
    content.includes('test subagent') ||
    (content.includes('nouvelle prod en cours') && content.includes('1787'))
  ) {
    return true;
  }
  return false;
};

// Local Storage Helper Functions with Quota Protection and Auto Test Purging
export const getStoredItem = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => !isTestArtifact(item));
    }
    return parsed;
  } catch (e) {
    console.warn(`Reading ${key} fallback:`, e.message);
    return fallback;
  }
};

export const setStoredItem = (key, value) => {
  try {
    const sanitized = Array.isArray(value)
      ? value.filter(item => !isTestArtifact(item))
      : value;
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (e) {
    console.warn(`Storage Quota note for ${key}:`, e.message);
    try {
      if (Array.isArray(value)) {
        const pruned = value.filter(item => !isTestArtifact(item)).map(item => {
          if (item.video && typeof item.video === 'string' && item.video.startsWith('data:')) {
            return { ...item, video: null };
          }
          if (item.image && typeof item.image === 'string' && item.image.startsWith('data:')) {
            return { ...item, image: null };
          }
          if (item.mediaUrl && typeof item.mediaUrl === 'string' && item.mediaUrl.startsWith('data:')) {
            return { ...item, mediaUrl: '' };
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

// Initialize seed storage - 100% Clean state for real authenticated users
export const initializeStorage = () => {
  // 1. Permanently purge any legacy mock/fake items from previous versions
  const serviceKeys = [
    { key: STORAGE_KEYS.PRO_WORKS, prefix: 'work_' },
    { key: STORAGE_KEYS.PRO_SERVICES, prefix: 'service_' },
    { key: STORAGE_KEYS.PRO_COURSES, prefix: 'course_' },
    { key: STORAGE_KEYS.PRO_EVENTS, prefix: 'event_' }
  ];

  serviceKeys.forEach(({ key, prefix }) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const authenticOnly = parsed.filter(item => {
            if (isTestArtifact(item)) return false;
            const itemId = String(item.id || item.work_id || item.course_id || item.event_id || '');
            return !itemId.startsWith(prefix);
          });
          localStorage.setItem(key, JSON.stringify(authenticOnly));
        }
      }
    } catch (e) {}
  });

  try {
    const rawMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (rawMatches) {
      const parsed = JSON.parse(rawMatches);
      if (Array.isArray(parsed)) {
        const authenticMatches = parsed.filter(m => m && m.id && !isTestArtifact(m) && !String(m.id).startsWith('match_'));
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(authenticMatches));
      }
    }
  } catch (e) {}

  try {
    const rawPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (rawPosts) {
      const parsed = JSON.parse(rawPosts);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(item => !isTestArtifact(item));
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(clean));
      }
    }
    const rawStories = localStorage.getItem(STORAGE_KEYS.STORIES);
    if (rawStories) {
      const parsed = JSON.parse(rawStories);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(item => !isTestArtifact(item));
        localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(clean));
      }
    }
    const rawChats = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (rawChats) {
      const parsed = JSON.parse(rawChats);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(item => !isTestArtifact(item));
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(clean));
      }
    }
  } catch (e) {}

  const existingUsers = getStoredItem(STORAGE_KEYS.USERS, []);
  let cleanUsers = [];
  if (Array.isArray(existingUsers)) {
    cleanUsers = existingUsers.filter(u => u && u.id && !isTestArtifact(u));
  }
  setStoredItem(STORAGE_KEYS.USERS, cleanUsers);

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

export { STORAGE_KEYS, INITIAL_USERS };
