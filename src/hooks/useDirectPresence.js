import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export function useDirectPresence(conversationId, currentUser) {
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [isOnline, setIsOnline] = useState(false);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !currentUser?.id || !isSupabaseConfigured()) return;

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: currentUser.id } }
    });

    channelRef.current = channel;

    // Listen to typing broadcasts
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId === currentUser.id) return;

      if (payload.isTyping) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(payload.userId, {
            name: payload.userName,
            avatar: payload.userAvatar,
            timestamp: Date.now()
          });
          return next;
        });

        // Auto-expire typing status after 4 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            const userState = next.get(payload.userId);
            if (userState && Date.now() - userState.timestamp >= 3800) {
              next.delete(payload.userId);
            }
            return next;
          });
        }, 4000);
      } else {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(payload.userId);
          return next;
        });
      }
    });

    // Track online presence
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const onlineIds = Object.keys(presenceState);
      setIsOnline(onlineIds.length > 1);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: currentUser.id,
          userName: currentUser.name || currentUser.full_name,
          onlineAt: new Date().toISOString()
        });
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, currentUser]);

  /**
   * Broadcast typing event (debounced)
   */
  const sendTypingEvent = useCallback((isTyping = true) => {
    if (!channelRef.current || !currentUser?.id) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUser.id,
        userName: currentUser.name || currentUser.full_name,
        userAvatar: currentUser.avatar || currentUser.avatar_url,
        isTyping
      }
    });

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingEvent(false);
      }, 3000);
    }
  }, [currentUser]);

  const typingArray = Array.from(typingUsers.values());
  const typingText = typingArray.length > 0
    ? `${typingArray.map((u) => u.name?.split(' ')[0]).join(', ')} écrit...`
    : null;

  return {
    typingUsers: typingArray,
    typingText,
    isOnline,
    sendTypingEvent
  };
}
