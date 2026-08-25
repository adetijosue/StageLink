/**
 * StageLink Storage & Legacy Artifact Sanitizer
 * Pure Supabase Backend — Zero Local Entity Persistence
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

// Clean State: No mock users, posts, or stories (Real Authenticated Supabase Database Only)
const INITIAL_USERS = [];

// Helper to detect test/dummy artifacts & legacy mock accounts
export const isTestArtifact = (item) => {
  if (!item) return false;
  if (item.is_test === true || item.is_test_account === true) return true;
  const author = String(item.userName || item.authorName || item.user_name || item.name || item.title || '').toLowerCase().trim();
  const userId = String(item.userId || item.user_id || item.id || item.conversation_id || item.chatId || '').toLowerCase().trim();
  const content = String(item.text || item.content || item.caption || item.lastMessage?.content || item.lastMessage?.text || '').toLowerCase();
  const partnerName = String(item.partner?.name || item.partner?.full_name || item.participant?.name || item.participant?.full_name || '').toLowerCase().trim();
  const senderName = String(item.senderName || item.sender_name || '').toLowerCase().trim();
  
  if (
    userId === 'chat_stagelink_official' ||
    userId.includes('stagelink_official') ||
    userId.includes('usr_stagelink') ||
    author.includes('stagelink support') ||
    partnerName.includes('stagelink support') ||
    senderName.includes('stagelink support') ||
    author === 'utilisateur' ||
    partnerName === 'utilisateur' ||
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

// Safe Local Storage Helper Functions
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
    console.warn(`Storage note for ${key}:`, e.message);
  }
};

// Storage Purge & Clean Initialization: Guarantees 100% Supabase-first live state
export const initializeStorage = () => {
  if (typeof localStorage === 'undefined') return;

  const legacyEntityKeys = [
    STORAGE_KEYS.POSTS,
    STORAGE_KEYS.STORIES,
    STORAGE_KEYS.MATCHES,
    STORAGE_KEYS.CHATS,
    STORAGE_KEYS.USERS,
    STORAGE_KEYS.PRO_WORKS,
    STORAGE_KEYS.PRO_SERVICES,
    STORAGE_KEYS.PRO_COURSES,
    STORAGE_KEYS.PRO_EVENTS
  ];

  legacyEntityKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  });

  // Purge any stale cached conversation fragments
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('stagelink_cached_conversations') || 
        key.startsWith('stagelink_cached_notes') ||
        key.startsWith('stagelink_cached_msgs')
      )) {
        localStorage.removeItem(key);
      }
    }
  } catch (_) {}
};

export { STORAGE_KEYS, INITIAL_USERS };
