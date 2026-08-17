import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { directChatService } from '../services/directChatService';
import { soundEngine } from '../services/audioService';

export function useChatThread({ conversationId, currentUser, partner }) {
  // 1. Instant Cache-First Initial State (0ms render)
  const [messages, setMessages] = useState(() => {
    if (!conversationId) return [];
    try {
      const cached = localStorage.getItem(`stagelink_cached_msgs_${conversationId}`);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.warn("Storage read error (messages):", e);
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (!conversationId) return false;
    try {
      const cached = localStorage.getItem(`stagelink_cached_msgs_${conversationId}`);
      return !cached || JSON.parse(cached).length === 0;
    } catch (e) {
      console.warn("Storage read error (messages initial state):", e);
      return true;
    }
  });

  const [isVanishMode, setIsVanishMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const channelRef = useRef(null);
  const isMountedRef = useRef(true);
  const initialLoadRef = useRef(messages.length > 0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const persistMessagesCache = useCallback((msgs) => {
    if (!conversationId || !Array.isArray(msgs)) return;
    try {
      localStorage.setItem(`stagelink_cached_msgs_${conversationId}`, JSON.stringify(msgs.slice(-50)));
    } catch (e) {
      console.warn("Storage write error (persist messages):", e);
    }
  }, [conversationId]);

  /**
   * Load Initial Page of Messages
   */
  const loadMessages = useCallback(async (silent = false) => {
    if (!conversationId || !isSupabaseConfigured()) {
      if (isMountedRef.current) setIsLoading(false);
      return;
    }

    if (!silent && messages.length === 0) {
      setIsLoading(true);
    }

    try {
      // 1. Fetch conversation details (e.g. Vanish mode state)
      const convPromise = supabase
        .from('conversations')
        .select('vanish_mode_enabled')
        .eq('id', conversationId)
        .maybeSingle();

      // 2. Fetch last 50 messages
      const msgsPromise = supabase
        .from('direct_messages')
        .select('*, reactions:message_reactions(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50);

      const [{ data: conv }, { data: msgs, error }] = await Promise.all([convPromise, msgsPromise]);

      if (conv && isMountedRef.current) {
        setIsVanishMode(Boolean(conv.vanish_mode_enabled));
      }

      if (error) throw error;
      
      const orderedMsgs = (msgs || []).reverse();
      if (isMountedRef.current) {
        setMessages(orderedMsgs);
        persistMessagesCache(orderedMsgs);
      }

      // 3. Mark conversation as read
      if (currentUser?.id) {
        directChatService.markAsRead(conversationId, currentUser.id);
      }
    } catch (e) {
      console.warn('Load messages error:', e);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [conversationId, currentUser, persistMessagesCache]);

  useEffect(() => {
    loadMessages(initialLoadRef.current);
  }, [loadMessages]);

  /**
   * Realtime Channel Subscriptions for Messages, Reactions & Vanish Mode
   */
  useEffect(() => {
    if (!conversationId || !isSupabaseConfigured()) return;

    const handleIncoming = (incomingMsg) => {
      if (!incomingMsg) return;
      if (incomingMsg.sender_id === currentUser?.id) return;

      const partnerId = partner?.id || partner?.userId || partner?.user_id;
      const isForThisThread =
        (incomingMsg.conversation_id && conversationId && String(incomingMsg.conversation_id) === String(conversationId)) ||
        (partnerId && (String(incomingMsg.sender_id) === String(partnerId) || String(incomingMsg.recipient_id) === String(partnerId)));

      if (!isForThisThread) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) return prev;
        const next = [...prev, incomingMsg];
        persistMessagesCache(next);
        return next;
      });

      soundEngine.playPopSound();
      if (currentUser?.id && conversationId) {
        directChatService.markAsRead(conversationId, currentUser.id);
      }
    };

    // 1. Listen to custom window event if App.jsx received it first
    const handleWindowDm = (e) => {
      if (e.detail) {
        handleIncoming(e.detail);
      }
    };
    window.addEventListener('direct_message_received', handleWindowDm);

    // 2. Realtime WebSocket Channel
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        handleIncoming(payload.new);
      })
      .on('broadcast', { event: 'new_direct_message' }, ({ payload }) => {
        const msg = payload?.message || payload;
        handleIncoming(msg);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const updatedMsg = payload.new;
        if (!updatedMsg) return;

        setMessages((prev) => {
          const next = prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
          persistMessagesCache(next);
          return next;
        });
      })
      .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
        if (payload?.conversationId === conversationId && payload?.readerId !== currentUser?.id) {
          // Recipient read our messages -> turn ticks to double blue instantly
          setMessages((prev) => {
            const next = prev.map((m) => {
              if (m.sender_id === currentUser?.id) {
                return { ...m, status: 'read', read: true, isRead: true };
              }
              return m;
            });
            persistMessagesCache(next);
            return next;
          });
        }
      })
      .on('broadcast', { event: 'reaction_added' }, ({ payload }) => {
        setMessages((prev) => {
          const next = prev.map((m) => {
            if (m.id === payload.messageId) {
              const reactions = m.reactions || [];
              if (!reactions.some((r) => r.user_id === payload.userId && r.emoji === payload.emoji)) {
                return { ...m, reactions: [...reactions, { user_id: payload.userId, emoji: payload.emoji }] };
              }
            }
            return m;
          });
          persistMessagesCache(next);
          return next;
        });
      })
      .on('broadcast', { event: 'reaction_removed' }, ({ payload }) => {
        setMessages((prev) => {
          const next = prev.map((m) => {
            if (m.id === payload.messageId) {
              const reactions = (m.reactions || []).filter(
                (r) => !(r.user_id === payload.userId && r.emoji === payload.emoji)
              );
              return { ...m, reactions };
            }
            return m;
          });
          persistMessagesCache(next);
          return next;
        });
      })
      .on('broadcast', { event: 'vanish_mode_toggled' }, ({ payload }) => {
        setIsVanishMode(payload.enabled);
        if (!payload.enabled) {
          // Vanish mode turned off -> remove vanished messages from local view
          setMessages((prev) => {
            const next = prev.filter((m) => !m.is_vanished);
            persistMessagesCache(next);
            return next;
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      window.removeEventListener('direct_message_received', handleWindowDm);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (currentUser?.id && conversationId) {
        directChatService.markAsRead(conversationId, currentUser.id);
      }
    };
  }, [conversationId, currentUser, partner, persistMessagesCache]);

  /**
   * Send Text / Media Message (Optimistic rendering)
   */
  const sendMessage = useCallback(async ({
    text = '',
    mediaUrl = null,
    mediaBlob = null,
    mediaType = 'text',
    metadata = {}
  }) => {
    if (!conversationId || !currentUser?.id) return;

    soundEngine.playMessageSentSound();
    const tempId = `temp_${Date.now()}`;

    // 1. Optimistic Local Message
    const optimisticMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      message_type: mediaType,
      content: text,
      media_url: mediaUrl || (mediaBlob ? URL.createObjectURL(mediaBlob) : null),
      metadata: {
        ...metadata,
        quotedMessage: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          senderName: replyingTo.sender_id === currentUser.id ? 'Vous' : (partner?.full_name || 'Artiste'),
          messageType: replyingTo.message_type
        } : null
      },
      reply_to_id: replyingTo?.id || null,
      status: 'sent',
      is_vanished: isVanishMode,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => {
      const next = [...prev, optimisticMsg];
      persistMessagesCache(next);
      return next;
    });
    setReplyingTo(null);

    // 2. Background Upload if Blob provided
    let finalMediaUrl = mediaUrl;
    if (mediaBlob && !mediaUrl) {
      finalMediaUrl = await directChatService.uploadMedia(mediaBlob, metadata.fileName || 'media', mediaType);
    }

    // 3. Persist and Broadcast
    try {
      const recipientId = partner?.id || partner?.userId || partner?.user_id;
      const savedRecord = await directChatService.sendMessage({
        conversationId,
        senderId: currentUser.id,
        recipientId,
        content: text,
        messageType: mediaType,
        mediaUrl: finalMediaUrl,
        metadata: optimisticMsg.metadata,
        replyToId: optimisticMsg.reply_to_id,
        isVanished: isVanishMode
      });

      // Replace optimistic record with server record
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === tempId ? savedRecord : m));
        persistMessagesCache(next);
        return next;
      });
    } catch (err) {
      console.warn("Message server sync fallback:", err);
      // Keep optimistic message locally with final media URL so media is never lost
      const fallbackRecord = {
        ...optimisticMsg,
        media_url: finalMediaUrl || optimisticMsg.media_url,
        status: 'sent'
      };
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === tempId ? fallbackRecord : m));
        persistMessagesCache(next);
        return next;
      });
    }
  }, [conversationId, currentUser, isVanishMode, replyingTo, partner, persistMessagesCache]);

  /**
   * Toggle Emoji Reaction
   */
  const toggleReaction = useCallback(async (messageId, emoji) => {
    if (!currentUser?.id) return;
    soundEngine.playPopSound();

    // Optimistic reaction update
    setMessages((prev) => {
      const next = prev.map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          const exists = reactions.some((r) => r.user_id === currentUser.id && r.emoji === emoji);
          if (exists) {
            return { ...m, reactions: reactions.filter((r) => !(r.user_id === currentUser.id && r.emoji === emoji)) };
          } else {
            return { ...m, reactions: [...reactions, { user_id: currentUser.id, emoji }] };
          }
        }
        return m;
      });
      persistMessagesCache(next);
      return next;
    });

    await directChatService.toggleReaction(messageId, currentUser.id, emoji, conversationId);
  }, [currentUser, conversationId, persistMessagesCache]);

  /**
   * Toggle Vanish Mode
   */
  const toggleVanishMode = useCallback(async () => {
    soundEngine.playPopSound();
    const nextState = !isVanishMode;
    setIsVanishMode(nextState);

    await directChatService.toggleVanishMode(conversationId, nextState);
    if (!nextState) {
      setMessages((prev) => {
        const next = prev.filter((m) => !m.is_vanished);
        persistMessagesCache(next);
        return next;
      });
    }
  }, [conversationId, isVanishMode, persistMessagesCache]);

  return {
    messages,
    isLoading,
    isVanishMode,
    replyingTo,
    setReplyingTo,
    sendMessage,
    toggleReaction,
    toggleVanishMode,
    refreshMessages: () => loadMessages(false)
  };
}
