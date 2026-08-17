import { supabase, isSupabaseConfigured } from './supabaseClient';
import { soundEngine } from './audioService';

class NativeNotificationService {
  constructor() {
    this.hasRequested = false;
    this.subscription = null;
    this.currentUserId = null;
  }

  /**
   * Request browser / mobile native notification permission
   */
  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      try {
        const result = await Notification.requestPermission();
        return result;
      } catch (err) {
        console.warn('Notification permission request note:', err);
        return Notification.permission;
      }
    }

    return Notification.permission;
  }

  /**
   * Send a native system notification with fallback to Service Worker or window Notification
   */
  async sendNotification({
    title = 'StageLink',
    body = '',
    icon = '/stagelink-logo.png',
    tag = 'stagelink_notif',
    data = {},
    playSound = true
  }) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (playSound) {
      try {
        soundEngine?.playMessageReceivedSound?.();
      } catch (_) {}
    }

    if (Notification.permission !== 'granted') return;

    const notifOptions = {
      body: body || '',
      icon: icon || '/stagelink-logo.png',
      badge: '/stagelink-logo.png',
      tag: tag || `stagelink_${Date.now()}`,
      vibrate: [200, 100, 200],
      renotify: true,
      data: {
        url: '/',
        timestamp: Date.now(),
        ...data
      }
    };

    // 1. Prefer Service Worker registration (works when backgrounded or mobile PWA)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notifOptions);
          return;
        }
      } catch (e) {
        console.warn('ServiceWorker notification note:', e);
      }
    }

    // 2. Direct Window Notification fallback
    try {
      const n = new Notification(title, notifOptions);
      n.onclick = (e) => {
        e.preventDefault();
        window.focus();
        if (data?.conversationId || data?.userId) {
          window.dispatchEvent(new CustomEvent('open_chat_conversation', { detail: data }));
        }
        n.close();
      };
    } catch (e) {
      console.warn('Direct notification error:', e);
    }
  }

  /**
   * Listen to real-time notification events in Supabase for currentUser
   */
  initRealtimeNotifications(currentUser, onNewNotification) {
    if (!currentUser || !currentUser.id || !isSupabaseConfigured()) return;

    this.currentUserId = currentUser.id;
    this.requestPermission().catch(() => {});

    if (this.subscription) {
      try {
        supabase.removeChannel(this.subscription);
      } catch (_) {}
    }

    const channelName = `realtime:native_notifs_${currentUser.id}`;
    this.subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        async (payload) => {
          const row = payload.new;
          if (!row) return;

          let actorName = 'Un utilisateur';
          let actorAvatar = '/stagelink-logo.png';

          try {
            if (row.actor_id) {
              const { data: actor } = await supabase
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', row.actor_id)
                .maybeSingle();

              if (actor) {
                actorName = actor.full_name || actor.username || actorName;
                actorAvatar = actor.avatar_url || actorAvatar;
              }
            }
          } catch (_) {}

          let notifTitle = 'StageLink';
          let notifBody = 'Vous avez reçu une nouvelle notification.';
          let notifTag = `notif_${row.id || Date.now()}`;

          switch (row.type) {
            case 'message':
              notifTitle = `💬 Message de ${actorName}`;
              notifBody = row.content || 'Vous a envoyé un nouveau message.';
              notifTag = `msg_${row.actor_id}`;
              break;

            case 'like_post':
              notifTitle = `❤️ Nouveau Like`;
              notifBody = `${actorName} a aimé votre publication.`;
              notifTag = `like_post_${row.reference_id || row.id}`;
              break;

            case 'comment_post':
              notifTitle = `💬 Nouveau Commentaire`;
              notifBody = `${actorName} a commenté : "${row.content || 'votre publication'}"`;
              notifTag = `comment_post_${row.reference_id || row.id}`;
              break;

            case 'like_story':
              notifTitle = `🔥 Réaction Story`;
              notifBody = `${actorName} a aimé votre story.`;
              notifTag = `like_story_${row.reference_id || row.id}`;
              break;

            case 'incoming_call_audio':
              notifTitle = `📞 Appel Audio Entrant`;
              notifBody = `${actorName} vous appelle en direct.`;
              notifTag = `call_${row.actor_id}`;
              break;

            case 'incoming_call_video':
              notifTitle = `📹 Appel Vidéo Entrant`;
              notifBody = `${actorName} vous appelle en vidéo direct.`;
              notifTag = `call_${row.actor_id}`;
              break;

            default:
              notifTitle = `🔔 Notification`;
              notifBody = `${actorName} : ${row.content || 'Nouvelle activité sur votre compte.'}`;
              break;
          }

          // Trigger native notification
          this.sendNotification({
            title: notifTitle,
            body: notifBody,
            icon: actorAvatar || '/stagelink-logo.png',
            tag: notifTag,
            data: {
              notificationId: row.id,
              type: row.type,
              actorId: row.actor_id,
              referenceId: row.reference_id
            }
          });

          if (typeof onNewNotification === 'function') {
            onNewNotification(row, { actorName, actorAvatar });
          }
        }
      )
      .subscribe();
  }

  cleanup() {
    if (this.subscription) {
      try {
        supabase.removeChannel(this.subscription);
      } catch (_) {}
      this.subscription = null;
    }
  }
}

export const nativeNotificationService = new NativeNotificationService();
