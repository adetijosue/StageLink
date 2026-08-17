import { supabase, isSupabaseConfigured } from './supabaseClient';

class PresenceService {
  constructor() {
    this.channel = null;
    this.currentUser = null;
    this.onlineUserMap = new Map();
    this.listeners = new Set();
    this.heartbeatTimer = null;
    this.isSubscribed = false;
  }

  /**
   * Track current authenticated user in global presence channel
   */
  track(user) {
    if (!user || !user.id || !isSupabaseConfigured()) {
      return;
    }

    // If same user is already being tracked and channel is active, just update data
    if (this.currentUser?.id === user.id && this.channel && this.isSubscribed) {
      this.currentUser = user;
      this.channel.track({
        userId: user.id,
        userName: user.name || user.full_name || 'Artiste',
        userRole: user.role || 'Artiste',
        userAvatar: user.avatar || user.avatar_url || '',
        updatedAt: new Date().toISOString()
      }).catch((e) => console.warn('Presence track refresh note:', e));
      return;
    }

    this.currentUser = user;
    this.cleanup();

    const channelName = 'global_user_presence';
    this.channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    // Listen to presence sync events
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel.presenceState();
      this.onlineUserMap.clear();
      
      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (Array.isArray(presences) && presences.length > 0) {
          const latest = presences[presences.length - 1];
          this.onlineUserMap.set(key, {
            userId: key,
            ...latest
          });
        } else {
          this.onlineUserMap.set(key, { userId: key });
        }
      });

      this.notifyListeners();
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (key) {
        const info = Array.isArray(newPresences) && newPresences.length > 0 ? newPresences[0] : {};
        this.onlineUserMap.set(key, { userId: key, ...info });
        this.notifyListeners();
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (key) {
        this.onlineUserMap.delete(key);
        this.notifyListeners();
      }
    });

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.isSubscribed = true;
        try {
          await this.channel.track({
            userId: user.id,
            userName: user.name || user.full_name || 'Artiste',
            userRole: user.role || 'Artiste',
            userAvatar: user.avatar || user.avatar_url || '',
            onlineAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Presence track init note:', err);
        }
      }
    });

    // Heartbeat every 25 seconds to keep presence alive even when in background
    this.heartbeatTimer = setInterval(() => {
      if (this.channel && this.isSubscribed && this.currentUser?.id) {
        this.channel.track({
          userId: this.currentUser.id,
          userName: this.currentUser.name || this.currentUser.full_name || 'Artiste',
          userRole: this.currentUser.role || 'Artiste',
          userAvatar: this.currentUser.avatar || this.currentUser.avatar_url || '',
          refreshedAt: new Date().toISOString()
        }).catch(() => {});
      }
    }, 25000);

    // Keep presence alive on tab visibility change (foreground / background)
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (this.channel && this.isSubscribed && this.currentUser?.id) {
          this.channel.track({
            userId: this.currentUser.id,
            userName: this.currentUser.name || this.currentUser.full_name || 'Artiste',
            userRole: this.currentUser.role || 'Artiste',
            userAvatar: this.currentUser.avatar || this.currentUser.avatar_url || '',
            visibilityState: document.visibilityState,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
      };

      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = handleVisibilityChange;
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }
  }

  /**
   * Check if a specific userId is currently online anywhere in the app
   */
  isUserOnline(userId) {
    if (!userId) return false;
    const strId = String(userId);
    return this.onlineUserMap.has(strId);
  }

  /**
   * Get list of all online user IDs
   */
  getOnlineUserIds() {
    return Array.from(this.onlineUserMap.keys());
  }

  /**
   * Subscribe a component or hook to online users updates
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      // Immediately notify current state
      listener(this.getOnlineUserIds());
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners() {
    const ids = this.getOnlineUserIds();
    this.listeners.forEach((listener) => {
      try {
        listener(ids);
      } catch (e) {
        console.error('Presence listener error:', e);
      }
    });
  }

  cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (_) {}
      this.channel = null;
    }
    this.isSubscribed = false;
  }

  untrack() {
    this.cleanup();
    this.currentUser = null;
    this.onlineUserMap.clear();
    this.notifyListeners();
  }
}

export const presenceService = new PresenceService();
