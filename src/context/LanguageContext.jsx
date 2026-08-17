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
    unfollow: 'Abonné',
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
    notifs_clear_all: 'Effacer l\'historique',

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
    nav_match: 'Match Pro',
    nav_discussions: 'Messages',
    nav_services: 'Pro Services',
    nav_profile: 'Profile',

    // TopBar & Header
    topbar_search_tooltip: 'Search member or artist',
    topbar_notifs_tooltip: 'Notifications',
    pass_gold: 'Gold Pass',
    vip_gold: 'Gold VIP',

    // Home / Feed
    feed_title: 'Activity Feed',
    feed_filter_for_you: 'For You',
    feed_filter_following: 'Following',
    feed_filter_trending: 'Trending',
    create_post_placeholder: 'Share a demo, a project, or news...',
    create_post_title: 'Create a Post',
    create_post_btn: 'Publish',
    create_post_cancel: 'Cancel',
    create_post_add_audio: 'Add an audio snippet / demo',
    create_post_add_media: 'Add a photo or video',
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
    listen_demo: 'Listen to demo',
    pause_demo: 'Pause',
    view_comments: 'View comments',
    add_comment_placeholder: 'Write a comment...',
    no_posts_found: 'No posts yet',
    no_posts_subtitle: 'Be the first to share a demo or a music project!',
    post_deleted: 'Post deleted',
    report_post: 'Report',
    delete_post: 'Delete',
    copied_link: 'Link copied to clipboard!',

    // Stories
    story_your_story: 'Your Story',
    story_reply_placeholder: 'Reply to story...',
    story_seen_by: 'Seen by',
    story_delete: 'Delete my story',
    story_record_video: 'Record a video',
    story_take_photo: 'Take a photo',

    // Match Pro
    match_title: 'Match Pro • Collaborations',
    match_subtitle: 'Swipe right to Match or left to Skip.',
    match_live_talents: 'LIVE TALENTS',
    match_synergy: 'Synergy',
    filter_all: 'All',
    filter_singers: 'Singers',
    filter_beatmakers: 'Beatmakers',
    filter_producers: 'Producers',
    filter_musicians: 'Musicians',
    filter_engineers: 'Sound Engineers',
    btn_match: 'MATCH',
    btn_skip: 'SKIP',
    btn_favorite: 'FAVORITE',
    match_success_title: 'It\'s a Match!',
    match_success_sub: 'You and this artist are now connected to co-create.',
    match_send_msg: 'Send a message',
    match_continue: 'Keep exploring',
    no_matches_left: 'You have seen all available profiles',
    no_matches_refresh: 'Refresh live profiles',

    // Discussions / Messaging
    msg_inbox_title: 'Messages',
    msg_search_placeholder: 'Search artists, chats...',
    tab_all: 'All',
    tab_unread: 'Unread',
    tab_groups: 'Groups',
    no_conv_found: 'No discussions found',
    start_new_chat: 'New Chat',
    call_history: 'Call History',
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
    audio_call: 'Voice call',
    video_call: 'Video call',
    vanish_mode: 'Vanish Mode (Disappearing)',
    missed_call: 'Missed call',
    incoming_call: 'Incoming call',
    outgoing_call: 'Outgoing call',
    call_back: 'Call back',
    call_ended: 'Call ended',
    calling: 'Calling...',

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

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('stagelink_lang') || 'fr';
    } catch (_) {
      return 'fr';
    }
  });

  const changeLanguage = (lang) => {
    if (lang === 'fr' || lang === 'en') {
      setLanguage(lang);
      try {
        localStorage.setItem('stagelink_lang', lang);
        // Also update HTML lang attribute
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
