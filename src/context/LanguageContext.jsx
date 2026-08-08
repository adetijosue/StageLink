import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  fr: {
    // Navigation
    nav_home: 'Home',
    nav_match: 'Match Pro',
    nav_discussions: 'Discussions',
    nav_services: 'Services Pro',
    nav_profile: 'Profil',

    // TopBar & Pass
    pass_gold: 'Pass Gold',
    vip_gold: 'VIP Or',

    // Home / Feed
    feed_title: 'Fil d\'actualités',
    create_post_placeholder: 'Partagez une maquette, un projet ou une actu...',
    publish: 'Publier',
    stories_title: 'Stories Studio',
    add_story: 'Ma Story',

    // Match Pro
    match_title: 'Mise en Relation de Talents',
    match_subtitle: 'Trouvez votre prochain collaborateur selon vos genres et instruments.',
    connect: 'Se Connecter',
    connected: 'Connecté',

    // Services Pro / Marketplace
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

    // Profile & Settings
    settings_title: 'Réglages & Préférences',
    edit_profile: 'Modifier Profil',
    appearance_theme: 'Apparence & Thème',
    theme_light: 'Clair',
    theme_dark: 'Sombre',
    theme_system: 'Système',
    desired_language: 'Langue Souhaitée',
    alerts_notifs: 'Alertes & Notifications',
    legal_mentions: 'Mentions Légales & Charte',
    cgu: 'Conditions d\'Utilisation (CGU)',
    privacy: 'Politique de Confidentialité',
    charter: 'Charte de la Communauté',
    logout: 'Se Déconnecter',
    powered_by: 'Powered by JABE PRODUCTION',

    // Bio & Info
    bio_title: 'Bio Artistique :',
    gear_title: 'Équipement Studio & Logiciels (DAW)',
    genres_title: 'Styles Préférés & Univers',
    network: 'Réseau',
    tracks: 'Morceaux',
    listens: 'Écoutes',
    collabs: 'Collabs'
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_match: 'Match Pro',
    nav_discussions: 'Discussions',
    nav_services: 'Pro Services',
    nav_profile: 'Profile',

    // TopBar & Pass
    pass_gold: 'Gold Pass',
    vip_gold: 'Gold VIP',

    // Home / Feed
    feed_title: 'Activity Feed',
    create_post_placeholder: 'Share a demo, project, or news...',
    publish: 'Publish',
    stories_title: 'Studio Stories',
    add_story: 'My Story',

    // Match Pro
    match_title: 'Talent Matching',
    match_subtitle: 'Find your next collaborator based on genres and instruments.',
    connect: 'Connect',
    connected: 'Connected',

    // Services Pro / Marketplace
    services_title: 'Pro Services & Marketplace',
    tab_works: 'Works Marketplace',
    tab_courses: 'Courses',
    tab_events: 'Events',
    sell_work: 'Sell Work',
    publish_course: 'Publish Course',
    create_event: 'Create Event',
    buy_licence: 'Buy Licence',
    enroll_course: 'Enroll Course',
    reserve_ticket: 'Reserve Ticket',

    // Profile & Settings
    settings_title: 'Settings & Preferences',
    edit_profile: 'Edit Profile',
    appearance_theme: 'Appearance & Theme',
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_system: 'System',
    desired_language: 'Language',
    alerts_notifs: 'Alerts & Notifications',
    legal_mentions: 'Legal & Guidelines',
    cgu: 'Terms of Service (ToS)',
    privacy: 'Privacy Policy',
    charter: 'Community Guidelines',
    logout: 'Log Out',
    powered_by: 'Powered by JABE PRODUCTION',

    // Bio & Info
    bio_title: 'Artist Bio:',
    gear_title: 'Studio Gear & DAW',
    genres_title: 'Preferred Styles & Universe',
    network: 'Network',
    tracks: 'Tracks',
    listens: 'Plays',
    collabs: 'Collabs'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('stagelink_lang') || 'fr';
  });

  const changeLanguage = (lang) => {
    if (lang === 'fr' || lang === 'en') {
      setLanguage(lang);
      localStorage.setItem('stagelink_lang', lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['fr']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
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
