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

// Community Artists Database Seeds for StageLink Ecosystem
const INITIAL_USERS = [
  {
    id: 'artist_alexandre_dubois',
    name: 'Alexandre Dubois',
    userName: 'alex_beats',
    full_name: 'Alexandre Dubois',
    username: 'alex_beats',
    role: 'Beatmaker / Compositeur',
    userRole: 'Beatmaker / Compositeur',
    email: 'alex.dubois@stagelink.music',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    cover_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200',
    coverPhoto: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200',
    bio: 'Producteur & Beatmaker spécialisé Trap, Drill et Afrobeat. Plus de 50 prods certifiées et collaborations avec des artistes émergents.',
    location: 'Paris, France',
    company: 'JABE Records',
    verified: true,
    badgeType: 'gold',
    instruments: ['FL Studio', 'MPC Live', 'Clavier Maître'],
    genres: ['Trap', 'Afrobeat', 'Drill', 'Hip-Hop'],
    gear: ['Yamaha HS8', 'Apollo Twin X', 'Shure SM7B'],
    spotifyUrl: 'https://spotify.com',
    instagramUrl: 'https://instagram.com'
  },
  {
    id: 'artist_lea_morel',
    name: 'Léa Morel',
    userName: 'lea_voice',
    full_name: 'Léa Morel',
    username: 'lea_voice',
    role: 'Chanteuse / Auteure-Compositrice',
    userRole: 'Chanteuse / Auteure-Compositrice',
    email: 'lea.morel@stagelink.music',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    cover_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200',
    coverPhoto: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200',
    bio: 'Chanteuse R&B / Pop Soul & Toplineuse. Voix chaude, harmonies travaillées et textes en français & anglais.',
    location: 'Lyon, France',
    company: 'Indépendante',
    verified: true,
    badgeType: 'blue',
    instruments: ['Chant Lead', 'Piano / Synthé', 'Toplining'],
    genres: ['R&B', 'Pop Soul', 'Neo-Soul', 'Variété Urbaine'],
    gear: ['Neumann TLM 103', 'Logic Pro X', 'Apollo Solo'],
    spotifyUrl: 'https://spotify.com',
    instagramUrl: 'https://instagram.com'
  },
  {
    id: 'artist_marcus_chen',
    name: 'Marcus Chen',
    userName: 'marcus_sound',
    full_name: 'Marcus Chen',
    username: 'marcus_sound',
    role: 'Ingénieur du Son / Mix & Master',
    userRole: 'Ingénieur du Son / Mix & Master',
    email: 'marcus.chen@stagelink.music',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200',
    coverPhoto: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200',
    bio: 'Ingénieur mixage & mastering analogique & numérique. Prêt à faire sonner vos titres aux standards radios et plateformes de streaming.',
    location: 'Bruxelles, Belgique',
    company: 'Skyline Audio Lab',
    verified: true,
    badgeType: 'gold',
    instruments: ['Pro Tools HD', 'Console SSL', 'Mastering Dolby Atmos'],
    genres: ['Hip-Hop', 'Pop', 'Électro', 'Rock'],
    gear: ['Focal Trio6 Be', 'Universal Audio UAD-2', 'Manley Massive Passive'],
    spotifyUrl: 'https://spotify.com'
  },
  {
    id: 'artist_david_kone',
    name: 'David Koné',
    userName: 'david_guitar',
    full_name: 'David Koné',
    username: 'david_guitar',
    role: 'Guitariste / Compositeur',
    userRole: 'Guitariste / Compositeur',
    email: 'david.kone@stagelink.music',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    cover_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200',
    coverPhoto: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200',
    bio: 'Guitariste électrique & acoustique session. Spécialiste des riffs Afrobeat, Funk et solos Rock mélodiques.',
    location: 'Abidjan / Paris',
    company: 'Groove Collective',
    verified: true,
    badgeType: 'gold',
    instruments: ['Guitare Électrique', 'Guitare Acoustique', 'Basse'],
    genres: ['Afrobeat', 'Funk', 'Rock', 'Reggae'],
    gear: ['Fender Stratocaster Custom', 'Gibson Les Paul', 'Kemper Profiler'],
    instagramUrl: 'https://instagram.com'
  },
  {
    id: 'artist_sofia_rossi',
    name: 'Sofia Rossi',
    userName: 'sofia_keys',
    full_name: 'Sofia Rossi',
    username: 'sofia_keys',
    role: 'Claviériste / Pianiste',
    userRole: 'Claviériste / Pianiste',
    email: 'sofia.rossi@stagelink.music',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    cover_url: 'https://images.unsplash.com/photo-1520523839898-507127043811?w=1200',
    coverPhoto: 'https://images.unsplash.com/photo-1520523839898-507127043811?w=1200',
    bio: 'Pianiste classique et claviériste Jazz/Neo-Soul. Enregistrement d’arrangements piano, rhodes et synthétiseurs pour vos morceaux.',
    location: 'Marseille, France',
    company: 'StageLink Artists',
    verified: true,
    badgeType: 'blue',
    instruments: ['Piano à queue', 'Rhodes', 'Moog Sub 37', 'Nord Stage 3'],
    genres: ['Neo-Soul', 'Jazz', 'Pop', 'Cinématique'],
    gear: ['Nord Stage 3', 'Apollo Twin', 'Logic Pro'],
    youtubeUrl: 'https://youtube.com'
  },
  {
    id: 'artist_sarah_benali',
    name: 'Sarah Benali',
    userName: 'sarah_topline',
    full_name: 'Sarah Benali',
    username: 'sarah_topline',
    role: 'Toplineuse / Directrice Artistique',
    userRole: 'Toplineuse / Directrice Artistique',
    email: 'sarah.benali@stagelink.music',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
    coverPhoto: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
    bio: 'Créatrice de refrains entêtants et toplines sur-mesure. Coaching vocal et accompagnement en studio.',
    location: 'Montréal / Paris',
    company: 'HitCraft Studios',
    verified: true,
    badgeType: 'gold',
    instruments: ['Voix Lead', 'Harmonies', 'Arrangements'],
    genres: ['Pop Urbaine', 'Électro', 'Afro-Pop', 'R&B'],
    gear: ['Shure KSM9', 'Universal Audio Arrow', 'Ableton Live'],
    tiktokUrl: 'https://tiktok.com'
  }
];

const INITIAL_STORIES = [];
const INITIAL_POSTS = [];
const INITIAL_SWIPE_MATCHES = [];
const INITIAL_CHATS = [];

// Helper to detect test/dummy artifacts (strictly targeting purged test accounts & test runs)
export const isTestArtifact = (item) => {
  if (!item) return false;
  if (item.is_test === true || item.is_test_account === true) return true;
  const author = String(item.userName || item.authorName || item.user_name || item.name || '').toLowerCase().trim();
  const userId = String(item.userId || item.user_id || item.id || '').toLowerCase().trim();
  const content = String(item.text || item.content || item.caption || '').toLowerCase();
  
  if (
    author === 'test subagent' ||
    author.includes('subagent') ||
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
    if (Array.isArray(parsed) && (key === STORAGE_KEYS.POSTS || key === STORAGE_KEYS.STORIES)) {
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
    const sanitized = Array.isArray(value) && (key === STORAGE_KEYS.POSTS || key === STORAGE_KEYS.STORIES)
      ? value.filter(item => !isTestArtifact(item))
      : value;
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (e) {
    console.warn(`Storage Quota note for ${key}:`, e.message);
    // Prune large Data URL media if storage quota is reached
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

// Initialize seed storage ONLY IF NOT ALREADY INITIALIZED (preserves user profile edits & custom avatar photos)
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
          // Keep only authentic items created by users with valid timestamps and generated UUID/prefixes
          const authenticItems = parsed.filter(
            item => item && item.id && String(item.id).startsWith(prefix) && item.createdAt
          );
          localStorage.setItem(key, JSON.stringify(authenticItems));
        } else {
          localStorage.setItem(key, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(key, JSON.stringify([]));
      }
    } catch (e) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  });

  try {
    const rawMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (rawMatches) {
      const parsed = JSON.parse(rawMatches);
      if (Array.isArray(parsed)) {
        const authenticMatches = parsed.filter(m => m && m.id && (String(m.id).startsWith('match_') || m.userId));
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
  } catch (e) {}

  const existingUsers = getStoredItem(STORAGE_KEYS.USERS, []);
  const userMap = new Map();
  INITIAL_USERS.forEach(u => userMap.set(u.id, u));
  if (Array.isArray(existingUsers)) {
    existingUsers.forEach(u => {
      if (u && u.id) {
        userMap.set(u.id, { ...(userMap.get(u.id) || {}), ...u });
      }
    });
  }
  setStoredItem(STORAGE_KEYS.USERS, Array.from(userMap.values()));

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
