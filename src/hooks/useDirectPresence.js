import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { presenceService } from '../services/presenceService';

export function useDirectPresence(conversationId, currentUser, partnerId) {
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [isConvOnline, setIsConvOnline] = useState(false);
  const [isGlobalOnline, setIsGlobalOnline] = useState(() => {
    return partnerId ? presenceService.isUserOnline(partnerId) : false;
  });

  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name || currentUser?.full_name;

  // 1. Subscribe to Global App Presence for partnerId
  useEffect(() => {
    if (!partnerId) {
      setIsGlobalOnline(false);
      return;
    }

    // Set initial state
    setIsGlobalOnline(presenceService.isUserOnline(partnerId));

    // Listen to global presence changes
    const unsubscribe = presenceService.subscribe(() => {
      setIsGlobalOnline(presenceService.isUserOnline(partnerId));
    });

    return unsubscribe;
  }, [partnerId]);

  // 2. Track Conversation-level channel for typing indicators
  useEffect(() => {
    const channelKey = conversationId || (partnerId && currentUserId ? `presence_pair_${[currentUserId, partnerId].sort().join('_')}` : null);
    if (!channelKey || !currentUserId || !isSupabaseConfigured()) return;

    const channel = supabase.channel(`presence:${channelKey}`, {
      config: { presence: { key: currentUserId } }
    });

    channelRef.current = channel;

    // Listen to typing broadcasts
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId === currentUserId) return;

      if (payload.isTyping) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(payload.userId, {
            name: payload.userName || 'Artiste',
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

    // Track online presence in this specific thread
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const onlineKeys = Object.keys(presenceState);
      if (partnerId) {
        setIsConvOnline(onlineKeys.includes(String(partnerId)));
      } else {
        setIsConvOnline(onlineKeys.length > 1);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: currentUserId,
          userName: currentUserName,
          onlineAt: new Date().toISOString()
        });
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, currentUserId, currentUserName, partnerId]);

  /**
   * Broadcast typing event (debounced)
   */
  const sendTypingEvent = useCallback((isTyping = true) => {
    const user = currentUserRef.current;
    if (!channelRef.current || !user?.id) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: user.id,
        userName: user.name || user.full_name,
        userAvatar: user.avatar || user.avatar_url,
        isTyping
      }
    });

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        const cur = currentUserRef.current;
        if (channelRef.current && cur?.id) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId: cur.id,
              userName: cur.name || cur.full_name,
              userAvatar: cur.avatar || cur.avatar_url,
              isTyping: false
            }
          });
        }
      }, 3000);
    }
  }, []);

  const typingArray = Array.from(typingUsers.values());
  const typingText = typingArray.length > 0
    ? `${typingArray.map((u) => u.name?.split(' ')[0]).join(', ')} est en train d'écrire...`
    : null;

  const isOnline = isGlobalOnline || isConvOnline;

  return {
    typingUsers: typingArray,
    typingText,
    isOnline,
    sendTypingEvent
  };
}

