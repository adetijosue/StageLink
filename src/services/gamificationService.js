/**
 * Gamification, XP & Badges Engine for StageLink
 * Calculates daily activity streaks, experience points (XP), artist tiers,
 * and unlocks accomplishment badges.
 */

const GAMIFICATION_KEY = 'stagelink_gamification_state';

export const ARTIST_TIERS = [
  { level: 1, name: 'Artiste Débutant', minXp: 0, badge: '🌱', color: '#94A3B8' },
  { level: 2, name: 'Musicien Actif', minXp: 100, badge: '🎵', color: '#3B82F6' },
  { level: 3, name: 'Beatmaker / Soliste', minXp: 300, badge: '⚡', color: '#8B5CF6' },
  { level: 4, name: 'Artiste Confirmé', minXp: 600, badge: '🔥', color: '#F59E0B' },
  { level: 5, name: 'Virtuose Studio', minXp: 1200, badge: '💎', color: '#EC4899' },
  { level: 6, name: 'Maestro StageLink', minXp: 2500, badge: '👑', color: '#EAB308' }
];

export const AVAILABLE_BADGES = [
  { id: 'first_post', title: 'Première Note', desc: 'A publié son premier post musical', icon: '🎸', xpReward: 50 },
  { id: 'first_chat', title: 'Connexion Studio', desc: 'A démarré sa première collaboration par chat', icon: '💬', xpReward: 30 },
  { id: 'fan_music', title: 'Mélomane', desc: 'A liké 5 publications de la communauté', icon: '❤️', xpReward: 25 },
  { id: 'active_streak_3', title: 'Rythme Tenace', desc: '3 jours consécutifs d\'activité', icon: '🔥', xpReward: 60 },
  { id: 'active_streak_7', title: 'Maître du Tempo', desc: '7 jours consécutifs de création', icon: '🏆', xpReward: 150 },
  { id: 'pro_audio', title: 'Ingénieur du Son', desc: 'A écouté 10 maquettes audio dans le lecteur', icon: '🎧', xpReward: 40 }
];

class GamificationService {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(GAMIFICATION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    return {
      xp: 50,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      unlockedBadges: ['first_chat'],
      interactionCounters: {
        likesCount: 0,
        postsCount: 0,
        chatsCount: 0,
        audioPlaysCount: 0
      }
    };
  }

  saveState() {
    try {
      localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(this.state));
      window.dispatchEvent(new CustomEvent('gamification_updated', { detail: this.state }));
    } catch (_) {}
  }

  checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.state.lastActiveDate;

    if (lastActive === today) return this.state.streak;

    const todayDate = new Date(today);
    const lastDate = new Date(lastActive);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      this.state.streak += 1;
      this.addXp(20, 'Bonus Série Quotidienne');
      if (this.state.streak >= 3) this.unlockBadge('active_streak_3');
      if (this.state.streak >= 7) this.unlockBadge('active_streak_7');
    } else if (diffDays > 1) {
      this.state.streak = 1;
    }

    this.state.lastActiveDate = today;
    this.saveState();
    return this.state.streak;
  }

  addXp(amount, reason = '') {
    this.state.xp = (this.state.xp || 0) + amount;
    this.saveState();
    return this.state.xp;
  }

  unlockBadge(badgeId) {
    if (!this.state.unlockedBadges.includes(badgeId)) {
      this.state.unlockedBadges.push(badgeId);
      const badgeObj = AVAILABLE_BADGES.find(b => b.id === badgeId);
      if (badgeObj && badgeObj.xpReward) {
        this.state.xp += badgeObj.xpReward;
      }
      this.saveState();
      window.dispatchEvent(new CustomEvent('badge_unlocked', { detail: badgeObj }));
    }
  }

  trackAction(actionType) {
    this.checkDailyStreak();
    switch (actionType) {
      case 'like':
        this.state.interactionCounters.likesCount = (this.state.interactionCounters.likesCount || 0) + 1;
        this.addXp(5);
        if (this.state.interactionCounters.likesCount >= 5) this.unlockBadge('fan_music');
        break;
      case 'post':
        this.state.interactionCounters.postsCount = (this.state.interactionCounters.postsCount || 0) + 1;
        this.addXp(30);
        this.unlockBadge('first_post');
        break;
      case 'chat':
        this.state.interactionCounters.chatsCount = (this.state.interactionCounters.chatsCount || 0) + 1;
        this.addXp(10);
        this.unlockBadge('first_chat');
        break;
      case 'audio_play':
        this.state.interactionCounters.audioPlaysCount = (this.state.interactionCounters.audioPlaysCount || 0) + 1;
        this.addXp(5);
        if (this.state.interactionCounters.audioPlaysCount >= 10) this.unlockBadge('pro_audio');
        break;
      default:
        break;
    }
    this.saveState();
  }

  getCurrentTier() {
    const xp = this.state.xp || 0;
    let currentTier = ARTIST_TIERS[0];
    for (const tier of ARTIST_TIERS) {
      if (xp >= tier.minXp) {
        currentTier = tier;
      }
    }
    return currentTier;
  }

  getNextTier() {
    const xp = this.state.xp || 0;
    for (const tier of ARTIST_TIERS) {
      if (xp < tier.minXp) return tier;
    }
    return null;
  }
}

export const gamification = new GamificationService();
