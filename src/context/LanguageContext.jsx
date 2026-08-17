import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  fr: {
    // Navigation
    nav_home: 'Accueil',
    nav_match: 'Match Pro',
    nav_discussions: 'Discussions',
    nav_services: 'Services Pro',
    nav_profile: 'Profil',

    // TopBar & Header
    topbar_search_tooltip: 'Rechercher un membre ou artiste',
    topbar_notifs_tooltip: 'Notifications',
    pass_gold: 'Pass Gold',
    vip_gold: 'VIP Or',

    // Home / Feed
    feed_title: 'Fil d\'actualités',
    feed_filter_for_you: 'Pour toi',
    feed_filter_following: 'Abonnements',
    feed_filter_trending: 'Tendances',
    create_post_placeholder: 'Partagez une maquette, un projet ou une actu...',
    create_post_title: 'Créer une publication',
    create_post_btn: 'Publier',
    create_post_cancel: 'Annuler',
    create_post_add_audio: 'Ajouter un extrait audio / maquette',
    create_post_add_media: 'Ajouter une photo ou vidéo',
    create_post_location: 'Ajouter un lieu',
    create_post_collaborators: 'Identifier des artistes',
    publish: 'Publier',
    publishing: 'Publication en cours...',
    stories_title: 'Stories Studio',
    add_story: 'Ma Story',
    create_story: 'Créer Story',
    like_btn: 'J\'aime',
    comment_btn: 'Commenter',
    share_btn: 'Partager',
    listen_demo: 'Écouter l\'extrait',
    pause_demo: 'Pause',
    view_comments: 'Voir les commentaires',
    add_comment_placeholder: 'Écrivez un commentaire...',
    no_posts_found: 'Aucune publication pour le moment',
    no_posts_subtitle: 'Soyez le premier à partager une maquette ou un projet musical !',
    post_deleted: 'Publication supprimée',
    report_post: 'Signaler',
    delete_post: 'Supprimer',
    copied_link: 'Lien copié dans le presse-papier !',

    // Stories
    story_your_story: 'Votre Story',
    story_reply_placeholder: 'Répondre à la story...',
    story_seen_by: 'Vues par',
    story_delete: 'Supprimer ma story',
    story_record_video: 'Enregistrer une vidéo',
    story_take_photo: 'Prendre une photo',

    // Match Pro
    match_title: 'Match Pro • Collaborations',
    match_subtitle: 'Glissez vers la droite pour Matcher ou vers la gauche pour Annuler.',
    match_live_talents: 'TALENTS EN DIRECT',
    match_synergy: 'Synergie',
    filter_all: 'Tous',
    filter_singers: 'Chanteurs',
    filter_beatmakers: 'Beatmakers',
    filter_producers: 'Producteurs',
    filter_musicians: 'Musiciens',
    filter_engineers: 'Ingés Son',
    btn_match: 'MATCHER',
    btn_skip: 'ANNULER',
    btn_favorite: 'FAVORI',
    match_success_title: 'C\'est un Match !',
    match_success_sub: 'Vous et cet artiste êtes désormais connectés pour co-créer.',
    match_send_msg: 'Envoyer un message',
    match_continue: 'Continuer à explorer',
    no_matches_left: 'Vous avez vu tous les profils disponibles',
    no_matches_refresh: 'Actualiser les profils réels',

    // Discussions / Messaging
    msg_inbox_title: 'Messages',
    msg_search_placeholder: 'Rechercher des artistes, discussions...',
    tab_all: 'Toutes',
    tab_unread: 'Non lues',
    tab_groups: 'Groupes',
    no_conv_found: 'Aucune discussion trouvée',
    start_new_chat: 'Nouvelle discussion',
    call_history: 'Historique des appels',
    online_status: 'En ligne',
    offline_status: 'Hors ligne',
    typing_status: 'En train d\'écrire...',
    type_message_placeholder: 'Écrivez un message...',
    voice_note: 'Note vocale',
    photo_media: 'Photo',
    video_media: 'Vidéo',
    doc_media: 'Document',
    hold_to_record: 'Maintenez pour enregistrer...',
    release_to_send: 'Relâchez pour envoyer',
    audio_call: 'Appel audio',
    video_call: 'Appel vidéo',
    vanish_mode: 'Mode Éphémère (Vanish)',
    missed_call: 'Appel manqué',
    incoming_call: 'Appel entrant',
    outgoing_call: 'Appel sortant',
    call_back: 'Rappeler',
    call_ended: 'Appel terminé',
    calling: 'Appel en cours...',

    // Services Pro & Marketplace
    services_title: 'Services Pro & Boutique',
    tab_works: 'Vente d\'Œuvres',
    tab_courses: 'Formations',
    tab_events: 'Événements',
    sell_work: 'Vendre une œuvre',
    publish_course: 'Publier Formation',
    create_event: 'Créer Événement',
    buy_licence: 'Acheter Licence',
    enroll_course: 'Suivre la Formation',
    reserve_ticket: 'Réserver ma Place',
    price: 'Prix',
    details: 'Détails',
    order_btn: 'Commander',
    free: 'Gratuit',
    all_categories: 'Toutes catégories',
    search_services: 'Rechercher des œuvres, beats, formations...',

    // Profile & Settings
    profile_title: 'Profil',
    profile_public_title: 'Profil Public',
    edit_profile: 'Modifier mon profil',
    settings_title: 'Réglages App',
    account_section: 'Compte',
    appearance_theme: 'Apparence',
    theme_light: 'Mode Clair',
    theme_dark: 'Mode Sombre',
    theme_system: 'Système',
    desired_language: 'Langue',
    alerts_notifs: 'Alertes & Notifications',
    legal_section: 'Légal',
    cgu: 'Conditions Générales d\'Utilisation (CGU)',
    privacy: 'Politique de Confidentialité',
    charter: 'Charte de la Communauté',
    logout: 'DÉCONNEXION',
    danger_zone: 'Zone Danger • Supprimer mon compte',
    delete_account_confirm: 'Êtes-vous sûr de vouloir supprimer définitivement votre compte ?',
    powered_by: 'StageLink • Powered by JABE PRODUCTION',

    // Bio & Profile Details
    bio_title: 'Bio Artistique',
    gear_title: 'Équipement Studio & Logiciels (DAW)',
    genres_title: 'Styles Préférés & Univers',
    portfolio_title: 'Mes Œuvres & Projets',
    posts_title: 'Publications',
    network: 'Réseau',
    tracks: 'Morceaux',
    listens: 'Écoutes',
    collabs: 'Collabs',
    followers: 'Abonnés',
    following: 'Abonnements',
    follow: 'Suivre',
    btn_follow: 'Suivre',
    following_btn: 'Suivi',
    unfollow: 'Suivi',
    contact_artist: 'Contacter',
    musical_cv: 'CV Musical',
    qr_card: 'Carte Contact QR',
    verified_profile: 'PROFIL VÉRIFIÉ',

    // Edit Profile Modal
    edit_name: 'Nom complet / Nom d\'artiste',
    edit_username: 'Nom d\'utilisateur (@)',
    edit_role: 'Rôle musical principal',
    edit_bio: 'Bio & Présentation',
    edit_location: 'Ville / Studio',
    edit_company: 'Label / Studio / Collectif',
    edit_instruments: 'Instruments pratiqués',
    edit_genres: 'Genres musicaux',
    edit_gear: 'Équipement & DAW',
    edit_save: 'Enregistrer les modifications',
    edit_saving: 'Enregistrement...',

    // Global Search & Paywall
    search_modal_title: 'Recherche Globale d\'Artistes',
    search_input_placeholder: 'Rechercher par nom, style, ville...',
    paywall_title: 'Pass VIP Gold StageLink',
    paywall_subtitle: 'Accédez à l\'écosystème musical complet sans limites.',
    paywall_feature_1: 'Mise en relation illimitée sur Match Pro',
    paywall_feature_2: 'Appels Audio & Vidéo HD prioritaires',
    paywall_feature_3: 'Vente d\'œuvres sans commission',
    paywall_feature_4: 'Badge Artiste Vérifié Gold officiel',
    paywall_subscribe_btn: 'Passer VIP Gold',

    // Notifications Drawer
    notifs_title: 'Notifications',
    notifs_empty: 'Aucune notification pour le moment',
    notifs_mark_all_read: 'Tout marquer comme lu',
    notifs_clear_all: 'Tout effacer',
    language_auto: 'Automatique (Appareil)',
    language_device_detected: 'Langue de votre appareil détectée',
    language_auto_desc: 'S\'adapte automatiquement à la langue de votre téléphone ou ordinateur',

    // Common Actions
    btn_back: 'Retour',
    btn_close: 'Fermer',
    btn_cancel: 'Annuler',
    btn_confirm: 'Confirmer',
    btn_delete: 'Supprimer',
    btn_save: 'Enregistrer',
    btn_edit: 'Modifier',
    loading: 'Chargement...',
    success: 'Succès',
    error: 'Une erreur est survenue'
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_match: 'Pro Match',
    nav_discussions: 'Messages',
    nav_services: 'Pro Services',
    nav_profile: 'Profile',

    // TopBar & Header
    topbar_search_tooltip: 'Search for a member or artist',
    topbar_notifs_tooltip: 'Notifications',
    pass_gold: 'Gold Pass',
    vip_gold: 'Gold VIP',

    // Home / Feed
    feed_title: 'News Feed',
    feed_filter_for_you: 'For You',
    feed_filter_following: 'Following',
    feed_filter_trending: 'Trending',
    create_post_placeholder: 'Share a demo, project, or news...',
    create_post_title: 'Create a post',
    create_post_btn: 'Publish',
    create_post_cancel: 'Cancel',
    create_post_add_audio: 'Add audio demo / sample',
    create_post_add_media: 'Add photo or video',
    create_post_location: 'Add location',
    create_post_collaborators: 'Tag artists',
    publish: 'Publish',
    publishing: 'Publishing...',
    stories_title: 'Studio Stories',
    add_story: 'My Story',
    create_story: 'Create Story',
    like_btn: 'Like',
    comment_btn: 'Comment',
    share_btn: 'Share',
    listen_demo: 'Play demo',
    pause_demo: 'Pause',
    view_comments: 'View comments',
    add_comment_placeholder: 'Write a comment...',
    no_posts_found: 'No posts yet',
    no_posts_subtitle: 'Be the first to share a demo or musical project!',
    post_deleted: 'Post deleted',
    report_post: 'Report',
    delete_post: 'Delete',
    copied_link: 'Link copied to clipboard!',

    // Stories
    story_your_story: 'Your Story',
    story_reply_placeholder: 'Reply to story...',
    story_seen_by: 'Viewed by',
    story_delete: 'Delete my story',
    story_record_video: 'Record video',
    story_take_photo: 'Take photo',

    // Match Pro
    match_title: 'Pro Match • Collaborations',
    match_subtitle: 'Swipe right to Match or swipe left to Pass.',
    match_live_talents: 'LIVE TALENTS',
    match_synergy: 'Synergy',
    filter_all: 'All',
    filter_singers: 'Singers',
    filter_beatmakers: 'Beatmakers',
    filter_producers: 'Producers',
    filter_musicians: 'Musicians',
    filter_engineers: 'Sound Eng.',
    btn_match: 'MATCH',
    btn_skip: 'PASS',
    btn_favorite: 'FAVORITE',
    match_success_title: 'It\'s a Match!',
    match_success_sub: 'You and this artist are now connected to co-create.',
    match_send_msg: 'Send message',
    match_continue: 'Keep exploring',
    no_matches_left: 'You have seen all available profiles',
    no_matches_refresh: 'Refresh real profiles',

    // Discussions / Messaging
    msg_inbox_title: 'Messages',
    msg_search_placeholder: 'Search artists, chats...',
    tab_all: 'All',
    tab_unread: 'Unread',
    tab_groups: 'Groups',
    no_conv_found: 'No conversations found',
    start_new_chat: 'New conversation',
    call_history: 'Call history',
    online_status: 'Online',
    offline_status: 'Offline',
    typing_status: 'Typing...',
    type_message_placeholder: 'Write a message...',
    voice_note: 'Voice note',
    photo_media: 'Photo',
    video_media: 'Video',
    doc_media: 'Document',
    hold_to_record: 'Hold to record...',
    release_to_send: 'Release to send',
    audio_call: 'Audio call',
    video_call: 'Video call',

    // Services Pro & Marketplace
    services_title: 'Pro Services & Store',
    tab_works: 'Works for Sale',
    tab_courses: 'Courses',
    tab_events: 'Events',
    sell_work: 'Sell a work',
    publish_course: 'Publish Course',
    create_event: 'Create Event',
    buy_licence: 'Buy License',
    enroll_course: 'Join Course',
    reserve_ticket: 'Book My Ticket',
    price: 'Price',
    details: 'Details',
    order_btn: 'Order',
    free: 'Free',
    all_categories: 'All categories',
    search_services: 'Search works, beats, courses...',

    // Profile & Settings
    profile_title: 'Profile',
    profile_public_title: 'Public Profile',
    edit_profile: 'Edit my profile',
    settings_title: 'App Settings',
    account_section: 'Account',
    appearance_theme: 'Appearance',
    theme_light: 'Light Mode',
    theme_dark: 'Dark Mode',
    theme_system: 'System',
    desired_language: 'Language',
    alerts_notifs: 'Alerts & Notifications',
    legal_section: 'Legal',
    cgu: 'Terms of Service (ToS)',
    privacy: 'Privacy Policy',
    charter: 'Community Charter',
    logout: 'LOG OUT',
    danger_zone: 'Danger Zone • Delete my account',
    delete_account_confirm: 'Are you sure you want to permanently delete your account?',
    powered_by: 'StageLink • Powered by JABE PRODUCTION',

    // Bio & Profile Details
    bio_title: 'Artist Bio',
    gear_title: 'Studio Gear & DAW',
    genres_title: 'Preferred Styles & Universe',
    portfolio_title: 'My Works & Projects',
    posts_title: 'Posts',
    network: 'Network',
    tracks: 'Tracks',
    listens: 'Plays',
    collabs: 'Collabs',
    followers: 'Followers',
    following: 'Following',
    follow: 'Follow',
    btn_follow: 'Follow',
    following_btn: 'Following',
    unfollow: 'Following',
    contact_artist: 'Contact',
    musical_cv: 'Musical CV',
    qr_card: 'QR Contact Card',
    verified_profile: 'VERIFIED PROFILE',

    // Edit Profile Modal
    edit_name: 'Full Name / Artist Name',
    edit_username: 'Username (@)',
    edit_role: 'Main Musical Role',
    edit_bio: 'Bio & Introduction',
    edit_location: 'City / Studio',
    edit_company: 'Label / Studio / Collective',
    edit_instruments: 'Instruments played',
    edit_genres: 'Music genres',
    edit_gear: 'Gear & DAW',
    edit_save: 'Save changes',
    edit_saving: 'Saving...',

    // Global Search & Paywall
    search_modal_title: 'Global Artist Search',
    search_input_placeholder: 'Search by name, genre, city...',
    paywall_title: 'StageLink VIP Gold Pass',
    paywall_subtitle: 'Unlock the full music ecosystem with zero limits.',
    paywall_feature_1: 'Unlimited talent matching on Match Pro',
    paywall_feature_2: 'Priority HD Voice & Video calls',
    paywall_feature_3: 'Sell music works with 0% commission',
    paywall_feature_4: 'Official Gold Verified Artist badge',
    paywall_subscribe_btn: 'Upgrade to VIP Gold',

    // Notifications Drawer
    notifs_title: 'Notifications',
    notifs_empty: 'No notifications yet',
    notifs_mark_all_read: 'Mark all as read',
    notifs_clear_all: 'Clear history',
    language_auto: 'Automatic (Device)',
    language_device_detected: 'Language detected on your device',
    language_auto_desc: 'Automatically adapts to the language of your phone or computer',

    // Common Actions
    btn_back: 'Back',
    btn_close: 'Close',
    btn_cancel: 'Cancel',
    btn_confirm: 'Confirm',
    btn_delete: 'Delete',
    btn_save: 'Save',
    btn_edit: 'Edit',
    loading: 'Loading...',
    success: 'Success',
    error: 'An error occurred'
  }
};

/**
 * Detect device/system language (Audio 19)
 * Checks navigator.languages, navigator.language, navigator.userLanguage
 */
export const getDeviceLanguage = () => {
  try {
    if (typeof navigator === 'undefined') return 'fr';
    const navLangs = navigator.languages || [
      navigator.language ||
      navigator.userLanguage ||
      navigator.browserLanguage ||
      navigator.systemLanguage ||
      ''
    ];

    for (const lang of navLangs) {
      if (!lang || typeof lang !== 'string') continue;
      const normalized = lang.toLowerCase().trim();
      if (normalized.startsWith('en')) return 'en';
      if (normalized.startsWith('fr')) return 'fr';
    }

    const primary = (navigator.language || '').toLowerCase().trim();
    if (primary.startsWith('en')) return 'en';
    if (primary.startsWith('fr')) return 'fr';

    // If device is in another language (e.g. Spanish, German, etc.), default to English for international compatibility
    if (primary && !primary.startsWith('fr')) return 'en';

    return 'fr';
  } catch (_) {
    return 'fr';
  }
};

export function LanguageProvider({ children }) {
  // Device language dynamically resolved
  const [deviceLang, setDeviceLang] = useState(() => getDeviceLanguage());

  // Determine initial language:
  // 1. Saved explicit setting in localStorage if present ('en', 'fr', or 'auto')
  // 2. If 'auto' or not set at all: automatically use device language!
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_lang');
      if (saved === 'en' || saved === 'fr') {
        return saved;
      }
      return getDeviceLanguage();
    } catch (_) {
      return getDeviceLanguage();
    }
  });

  const [isAuto, setIsAuto] = useState(() => {
    try {
      const saved = localStorage.getItem('stagelink_lang');
      return !saved || saved === 'auto';
    } catch (_) {
      return true;
    }
  });

  // Listen to OS/browser language change events dynamically
  useEffect(() => {
    const handleLanguageChange = () => {
      const detected = getDeviceLanguage();
      setDeviceLang(detected);
      const saved = localStorage.getItem('stagelink_lang');
      // If user hasn't forced a manual lock or selected auto, apply immediately
      if (!saved || saved === 'auto') {
        setLanguage(detected);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('languagechange', handleLanguageChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('languagechange', handleLanguageChange);
      }
    };
  }, []);

  const changeLanguage = (lang, setAsAuto = false) => {
    if (setAsAuto || lang === 'auto') {
      const detected = getDeviceLanguage();
      setLanguage(detected);
      setIsAuto(true);
      try {
        localStorage.setItem('stagelink_lang', 'auto');
        if (typeof document !== 'undefined') {
          document.documentElement.lang = detected;
        }
      } catch (_) {}
      return;
    }

    if (lang === 'fr' || lang === 'en') {
      setLanguage(lang);
      setIsAuto(false);
      try {
        localStorage.setItem('stagelink_lang', lang);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang;
        }
      } catch (_) {}
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key, fallback = '') => {
    return translations[language]?.[key] || translations['fr']?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      deviceLanguage: deviceLang,
      isAuto,
      changeLanguage,
      t,
      isEnglish: language === 'en',
      isFrench: language === 'fr'
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
