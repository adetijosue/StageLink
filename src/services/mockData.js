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

// Curated Active Artist Community Roster for Production & Realtime Social Networking
const INITIAL_USERS = [
  {
    id: 'usr_sarah_j',
    name: 'Sarah Jenkins',
    email: 'sarah.j@stagelink.com',
    role: 'Chanteuse / Vocal',
    location: 'Paris, France',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    verified: true,
    badgeType: 'gold',
    bio: 'Chanteuse Soul & Afro-Gospel. Ouverte aux featurings et collaborations vocales studio.',
    instruments: ['Chanteur / Vocal', 'Piano / Clavier'],
    genres: ['R&B / Soul', 'Afro-Gospel', 'Pop']
  },
  {
    id: 'usr_marcus_v',
    name: 'Marcus Vance',
    email: 'marcus.v@stagelink.com',
    role: 'Beatmaker / Producer',
    location: 'Abidjan / Paris',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    verified: true,
    badgeType: 'blue',
    bio: 'Beatmaker & Producer Afrobeat, Amapiano & Rap. Studio équipé prêts pour collabs.',
    instruments: ['Beatmaker / Producer', 'Percussions'],
    genres: ['Afrobeat', 'Amapiano', 'Hip-Hop / Rap']
  },
  {
    id: 'usr_elena_r',
    name: 'Elena Rostova',
    email: 'elena.r@stagelink.com',
    role: 'Piano / Clavier',
    location: 'Lyon, France',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    verified: true,
    badgeType: 'gold',
    bio: 'Claviériste de concert & arrangera. Spécialisée dans les arrangements cordes et piano.',
    instruments: ['Piano / Clavier', 'Violon'],
    genres: ['Classique', 'Gospel', 'Jazz']
  },
  {
    id: 'usr_alex_r',
    name: 'Alex Rivera',
    email: 'alex.r@stagelink.com',
    role: 'Ingénieur Son',
    location: 'Marseille, France',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    verified: true,
    badgeType: 'blue',
    bio: 'Ingénieur du son Studio & Mastering. 10 ans d\'expérience dans le mixage professionnel.',
    instruments: ['Ingénieur Son', 'Directeur Artistique'],
    genres: ['Afrobeat', 'Pop', 'Hip-Hop / Rap']
  },
  {
    id: 'usr_david_k',
    name: 'David Kalu',
    email: 'david.k@stagelink.com',
    role: 'Guitare Électrique',
    location: 'Douala / Paris',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    verified: false,
    badgeType: 'none',
    bio: 'Guitariste soliste Makossa & Soukous. Recherche chanteurs et beatmakers pour projets EP.',
    instruments: ['Guitare Électrique', 'Guitare Acoustique'],
    genres: ['Afrobeat', 'Zouk / Kizomba', 'Funk']
  },
  {
    id: 'usr_sonia_b',
    name: 'Sonia Benali',
    email: 'sonia.b@stagelink.com',
    role: 'Directeur Artistique',
    location: 'Casablanca / Paris',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    verified: true,
    badgeType: 'gold',
    bio: 'Directrice Artistique & Label Manager. À la recherche de nouveaux talents prometteurs sur StageLink.',
    instruments: ['Directeur Artistique', 'Compositeur / Auteur'],
    genres: ['Pop', 'R&B / Soul', 'Afrobeat']
  },
  {
    id: 'usr_stagelink_team',
    name: 'StageLink Support Officiel',
    email: 'support@stagelink.com',
    role: 'Équipe Officielle StageLink',
    location: 'Paris, France',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    verified: true,
    badgeType: 'gold',
    bio: 'Compte Officiel de l\'équipe StageLink. Assistance 24/7 et conciergerie artistique.',
    instruments: ['Ingénieur Son', 'Directeur Artistique'],
    genres: ['Afrobeat', 'Gospel', 'Pop']
  }
];

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
