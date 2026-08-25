import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { directChatService } from '../services/directChatService';
import { soundEngine } from '../services/audioService';
import { haptics } from '../services/hapticsService';

export function useChatThread({ conversationId, currentUser, partner }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVanishMode, setIsVanishMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const channelRef = useRef(null);
  const isMountedRef = useRef(true);
  const initialLoadRef = useRef(false);
  const messagesLengthRef = useRef(0);
  const objectUrlsRef = useRef([]);

  // Keep ref in sync so cleanup reads current value without re-triggering the effect
  useEffect(() => {
    messagesLengthRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Revoke any created Object URLs to prevent memory leaks
      objectUrlsRef.current.forEach(url => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      });
      objectUrlsRef.current = [];
      // If thread had 0 messages when closed, clean up stub conversation from DB
      if (conversationId && messagesLengthRef.current === 0) {
        directChatService.cleanupEmptyConversation(conversationId);
        window.dispatchEvent(new Event('refresh_conversations'));
      }
    };
  }, [conversationId]);

  const persistMessagesCache = useCallback(() => {}, []);

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
      const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str || ''));
      const partnerId = partner?.id || partner?.userId || partner?.user_id || (conversationId ? (conversationId.startsWith('conv_') ? conversationId.replace('conv_', '') : (conversationId.startsWith('chat_') ? conversationId.replace('chat_', '') : null)) : null);

      // Resolve UUID conversation if needed
      let resolvedConvId = isValidUUID(conversationId) ? conversationId : null;
      if (!resolvedConvId && partnerId && currentUser?.id && isValidUUID(partnerId) && isValidUUID(currentUser.id)) {
        try {
          const { data: myParts } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

          if (myParts && myParts.length > 0) {
            const convIds = myParts.map(p => p.conversation_id);
            const { data: partnerParts } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .eq('user_id', partnerId)
              .in('conversation_id', convIds)
              .limit(1);

            if (partnerParts && partnerParts.length > 0 && partnerParts[0].conversation_id) {
              resolvedConvId = partnerParts[0].conversation_id;
            }
          }
        } catch (_) {}
      }

      // 1. Fetch conversation details (e.g. Vanish mode state)
      const convPromise = resolvedConvId
        ? supabase
            .from('conversations')
            .select('vanish_mode_enabled')
            .eq('id', resolvedConvId)
            .maybeSingle()
        : Promise.resolve({ data: null });

      // 2. Fetch messages from direct_messages table
      const msgsPromise = resolvedConvId
        ? supabase
            .from('direct_messages')
            .select('*, reactions:message_reactions(*)')
            .eq('conversation_id', resolvedConvId)
            .order('created_at', { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] });

      // 3. Also fetch from messages table for complete backward and forward compatibility
      const messagesTablePromise = partnerId && currentUser?.id
        ? supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: false })
            .limit(50)
            .catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      const [{ data: conv }, { data: msgs }, { data: legacyMsgs }] = await Promise.all([
        convPromise.catch(() => ({ data: null })),
        msgsPromise.catch(() => ({ data: [] })),
        messagesTablePromise.catch(() => ({ data: [] }))
      ]);

      if (conv && isMountedRef.current) {
        setIsVanishMode(Boolean(conv.vanish_mode_enabled));
      }

      const allMsgsMap = new Map();
      (legacyMsgs || []).forEach(m => {
        if (!m || !m.id) return;
        allMsgsMap.set(m.id, {
          id: m.id,
          conversation_id: resolvedConvId || conversationId,
          sender_id: m.sender_id,
          message_type: m.metadata?.mediaType || (m.audio_url ? 'audio' : (m.media_url ? 'image' : 'text')),
          content: m.content || m.text || '',
          media_url: m.media_url || m.audio_url || null,
          metadata: m.metadata || {},
          status: 'sent',
          is_vanished: false,
          created_at: m.created_at || new Date().toISOString()
        });
      });

      (msgs || []).forEach(m => {
        if (!m || !m.id) return;
        allMsgsMap.set(m.id, {
          id: m.id,
          conversation_id: resolvedConvId || conversationId,
          sender_id: m.sender_id,
          message_type: m.message_type || (m.audio_url ? 'audio' : (m.media_url ? 'image' : 'text')),
          content: m.content || m.text || '',
          media_url: m.media_url || m.audio_url || null,
          metadata: m.metadata || {},
          status: m.status || 'sent',
          is_vanished: Boolean(m.is_vanished),
          reactions: m.reactions || [],
          created_at: m.created_at || new Date().toISOString()
        });
      });

      const mergedList = Array.from(allMsgsMap.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      if (isMountedRef.current) {
        setMessages(mergedList);
        if (mergedList.length > 0) {
          persistMessagesCache(mergedList);
        }
      }

      // Mark conversation as read across all systems
      if (currentUser?.id) {
        if (resolvedConvId) directChatService.markAsRead(resolvedConvId, currentUser.id);
        if (conversationId) directChatService.markAsRead(conversationId, currentUser.id);

        if (partnerId) {
          try {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('receiver_id', currentUser.id)
              .eq('sender_id', partnerId);
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Load messages error:', e);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [conversationId, currentUser, partner, persistMessagesCache]);

  useEffect(() => {
    loadMessages(initialLoadRef.current);
  }, [loadMessages]);

  /**
   * Realtime Channel Subscriptions for Messages, Reactions & Vanish Mode
   */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const partnerId = partner?.id || partner?.userId || partner?.user_id || (conversationId ? (conversationId.startsWith('conv_') ? conversationId.replace('conv_', '') : (conversationId.startsWith('chat_') ? conversationId.replace('chat_', '') : null)) : null);
    const currentUserId = currentUser?.id;
    const channelKey = conversationId || (partnerId && currentUserId ? `dm_pair_${[currentUserId, partnerId].sort().join('_')}` : null);

    const handleIncoming = (incomingMsg) => {
      if (!incomingMsg) return;
      if (incomingMsg.sender_id === currentUserId) return;

      const incomingSender = String(incomingMsg.sender_id || '');
      const incomingReceiver = String(incomingMsg.receiver_id || incomingMsg.recipient_id || '');
      const incomingConv = String(incomingMsg.conversation_id || '');

      const isForThisThread =
        (incomingConv && conversationId && incomingConv === String(conversationId)) ||
        (partnerId && (incomingSender === String(partnerId) || incomingReceiver === String(partnerId))) ||
        (incomingSender && partnerId && incomingSender === String(partnerId));

      if (!isForThisThread) return;

      const formatted = {
        id: incomingMsg.id || `inc_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: incomingMsg.sender_id,
        message_type: incomingMsg.message_type || (incomingMsg.audio_url ? 'audio' : (incomingMsg.media_url ? 'image' : 'text')),
        content: incomingMsg.content || incomingMsg.text || '',
        media_url: incomingMsg.media_url || incomingMsg.audio_url || null,
        metadata: incomingMsg.metadata || {},
        status: 'sent',
        is_vanished: Boolean(incomingMsg.is_vanished),
        created_at: incomingMsg.created_at || new Date().toISOString()
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === formatted.id)) return prev;
        const next = [...prev, formatted];
        persistMessagesCache(next);
        return next;
      });

      soundEngine.playPopSound();
      if (currentUserId && conversationId) {
        directChatService.markAsRead(conversationId, currentUserId);
      }
    };

    // 1. Listen to custom window events if App.jsx received it first
    const handleWindowDm = (e) => {
      if (e.detail) {
        handleIncoming(e.detail);
      }
    };
    window.addEventListener('direct_message_received', handleWindowDm);
    window.addEventListener('new_message_received', handleWindowDm);

    // 2. Realtime WebSocket Channels
    const channel = supabase
      .channel(`dm:${channelKey || 'general'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        handleIncoming(payload.new);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        handleIncoming(payload.new);
      })
      .on('broadcast', { event: 'new_direct_message' }, ({ payload }) => {
        const msg = payload?.message || payload;
        handleIncoming(msg);
      })
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const msg = payload?.message || payload;
        handleIncoming(msg);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        const updatedMsg = payload.new;
        if (!updatedMsg) return;

        setMessages((prev) => {
          const next = prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
          persistMessagesCache(next);
          return next;
        });
      })
      .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
        if ((payload?.conversationId === conversationId || payload?.partnerId === currentUserId) && payload?.readerId !== currentUserId) {
          // Recipient read our messages -> turn ticks to double blue instantly
          setMessages((prev) => {
            const next = prev.map((m) => {
              if (m.sender_id === currentUserId) {
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
          setMessages((prev) => {
            const next = prev.filter((m) => !m.is_vanished);
            persistMessagesCache(next);
            return next;
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    // 3. Fallback safety-net polling every 15 seconds (Realtime WebSocket handles instant delivery)
    const pollTimer = setInterval(() => {
      if (isMountedRef.current) {
        loadMessages(true);
      }
    }, 15000);

    return () => {
      window.removeEventListener('direct_message_received', handleWindowDm);
      window.removeEventListener('new_message_received', handleWindowDm);
      clearInterval(pollTimer);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (currentUserId && conversationId) {
        directChatService.markAsRead(conversationId, currentUserId);
      }
    };
  }, [conversationId, currentUser, partner, persistMessagesCache, loadMessages]);

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
      media_url: mediaUrl || (mediaBlob ? (() => { const url = URL.createObjectURL(mediaBlob); objectUrlsRef.current.push(url); return url; })() : null),
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

    window.dispatchEvent(new CustomEvent('refresh_conversations', { detail: { conversationId, lastMessage: optimisticMsg } }));

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

      window.dispatchEvent(new CustomEvent('refresh_conversations', { detail: { conversationId, lastMessage: savedRecord } }));
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
   * Delete Message For Me (local hide & cache update)
   */
  const deleteMessageForMe = useCallback(async (messageId) => {
    if (!messageId) return;
    soundEngine.playPopSound();
    haptics.medium();

    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== messageId);
      persistMessagesCache(next);
      return next;
    });

    if (currentUser?.id && conversationId && isSupabaseConfigured()) {
      try {
        await directChatService.deleteMessageForMe(messageId, currentUser.id);
      } catch (e) {
        console.warn('Delete message for me note:', e);
      }
    }
  }, [conversationId, currentUser?.id, persistMessagesCache]);

  /**
   * Delete Message For Everyone (Unsend / full purge)
   */
  const deleteMessageForEveryone = useCallback(async (messageId) => {
    if (!messageId) return;
    soundEngine.playPopSound();
    haptics.heavy();

    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== messageId);
      persistMessagesCache(next);
      return next;
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('direct_messages').delete().eq('id', messageId);
        await supabase.from('messages').delete().eq('id', messageId);

        // Broadcast deletion event to partner
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'message_deleted',
            payload: { messageId, conversationId }
          });
        }
      } catch (e) {
        console.warn('Delete message for everyone note:', e);
      }
    }
  }, [conversationId, persistMessagesCache]);

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
    deleteMessageForMe,
    deleteMessageForEveryone,
    toggleReaction,
    toggleVanishMode,
    refreshMessages: () => loadMessages(false)
  };
}
