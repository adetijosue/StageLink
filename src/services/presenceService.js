import { supabase, isSupabaseConfigured } from './supabaseClient';

class PresenceService {
  constructor() {
    this.channel = null;
    this.currentUser = null;
    this.onlineUserMap = new Map();
    this.listeners = new Set();
    this.heartbeatTimer = null;
    this.expiryTimer = null;
    this.isSubscribed = false;
    this.isNetworkOnline = typeof navigator !== 'undefined' ? (navigator.onLine !== false) : true;

    this._bindSystemEvents();
  }

  /**
   * Bind system-level network and window lifecycle events
   */
  _bindSystemEvents() {
    if (typeof window === 'undefined') return;

    // 1. Device Network Connection change
    window.addEventListener('online', () => {
      this.isNetworkOnline = true;
      if (this.currentUser) {
        this.track(this.currentUser);
      }
    });

    window.addEventListener('offline', () => {
      this.isNetworkOnline = false;
      // When network is lost, immediately notify listeners and cease presence
      if (this.currentUser?.id) {
        this.onlineUserMap.delete(String(this.currentUser.id));
      }
      this.notifyListeners();
    });

    // 2. App lifecycle & unloading events (App closed, tab closed, killed from multitasking)
    const handleUnloadOrHide = () => {
      if (this.channel && this.isSubscribed && this.currentUser?.id) {
        try {
          this.channel.untrack();
        } catch (_) {}
      }
    };

    window.addEventListener('pagehide', handleUnloadOrHide);
    window.addEventListener('beforeunload', handleUnloadOrHide);
    if (typeof document !== 'undefined') {
      document.addEventListener('freeze', handleUnloadOrHide);
    }

    // 3. Periodic expiration check for peers (in case an app was abruptly killed without sending leave)
    this.expiryTimer = setInterval(() => {
      this._purgeExpiredPeers();
    }, 12000);
  }

  /**
   * Automatically remove peers whose heartbeats haven't refreshed for > 35 seconds
   */
  _purgeExpiredPeers() {
    const now = Date.now();
    let hasChanges = false;

    this.onlineUserMap.forEach((val, key) => {
      // If peer has a recorded timestamp older than 35s (and is not currentUser on active tab)
      if (key !== String(this.currentUser?.id) && val.lastSeenAt) {
        if (now - val.lastSeenAt > 35000) {
          this.onlineUserMap.delete(key);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      this.notifyListeners();
    }
  }

  /**
   * Track current authenticated user in global presence channel
   */
  track(user) {
    if (!user || !user.id || !isSupabaseConfigured()) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.isNetworkOnline = false;
      return;
    }

    this.isNetworkOnline = true;
    this.currentUser = user;

    // If same user is already being tracked and channel is active, refresh track
    if (this.channel && this.isSubscribed) {
      this.channel.track({
        userId: String(user.id),
        userName: user.name || user.full_name || 'Artiste',
        userRole: user.role || 'Artiste',
        userAvatar: user.avatar || user.avatar_url || '',
        lastSeenAt: Date.now(),
        updatedAt: new Date().toISOString()
      }).catch((e) => console.warn('Presence track refresh note:', e));
      return;
    }

    this.cleanupChannel();

    const channelName = 'global_user_presence';
    this.channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: String(user.id)
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
          this.onlineUserMap.set(String(key), {
            userId: String(key),
            lastSeenAt: Date.now(),
            ...latest
          });
        } else {
          this.onlineUserMap.set(String(key), {
            userId: String(key),
            lastSeenAt: Date.now()
          });
        }
      });

      // Also ensure self is marked online if network is on
      if (this.isNetworkOnline && this.currentUser?.id) {
        this.onlineUserMap.set(String(this.currentUser.id), {
          userId: String(this.currentUser.id),
          lastSeenAt: Date.now(),
          userName: this.currentUser.name || this.currentUser.full_name || 'Artiste'
        });
      }

      this.notifyListeners();
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (key) {
        const info = Array.isArray(newPresences) && newPresences.length > 0 ? newPresences[0] : {};
        this.onlineUserMap.set(String(key), {
          userId: String(key),
          lastSeenAt: Date.now(),
          ...info
        });
        this.notifyListeners();
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (key) {
        this.onlineUserMap.delete(String(key));
        this.notifyListeners();
      }
    });

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.isSubscribed = true;
        try {
          await this.channel.track({
            userId: String(user.id),
            userName: user.name || user.full_name || 'Artiste',
            userRole: user.role || 'Artiste',
            userAvatar: user.avatar || user.avatar_url || '',
            lastSeenAt: Date.now(),
            onlineAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Presence track init note:', err);
        }
      }
    });

    // Active Heartbeat every 18 seconds to keep presence alive in background & foreground
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.isNetworkOnline && this.channel && this.isSubscribed && this.currentUser?.id) {
        this.channel.track({
          userId: String(this.currentUser.id),
          userName: this.currentUser.name || this.currentUser.full_name || 'Artiste',
          userRole: this.currentUser.role || 'Artiste',
          userAvatar: this.currentUser.avatar || this.currentUser.avatar_url || '',
          lastSeenAt: Date.now(),
          refreshedAt: new Date().toISOString()
        }).catch(() => {});
      }
    }, 18000);
  }

  /**
   * Check if a specific userId is currently online
   * Returns true (Green) if user is active & connected, false (Grey) otherwise
   */
  isUserOnline(userId) {
    if (!userId) return false;
    const strId = String(userId);
    
    // If self is checked and device is offline, return false
    if (this.currentUser?.id && strId === String(this.currentUser.id)) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
      if (!this.isNetworkOnline) return false;
    }

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

  cleanupChannel() {
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
    this.cleanupChannel();
    this.currentUser = null;
    this.onlineUserMap.clear();
    this.notifyListeners();
  }
}

export const presenceService = new PresenceService();
