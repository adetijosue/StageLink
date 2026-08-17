import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { directChatService } from '../services/directChatService';
import { soundEngine } from '../services/audioService';

export function useChatThread({ conversationId, currentUser, partner }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVanishMode, setIsVanishMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const channelRef = useRef(null);

  /**
   * Load Initial Page of Messages
   */
  const loadMessages = useCallback(async () => {
    if (!conversationId || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch conversation details (e.g. Vanish mode state)
      const { data: conv } = await supabase
        .from('conversations')
        .select('vanish_mode_enabled')
        .eq('id', conversationId)
        .maybeSingle();

      if (conv) setIsVanishMode(Boolean(conv.vanish_mode_enabled));

      // 2. Fetch last 50 messages
      const { data: msgs, error } = await supabase
        .from('direct_messages')
        .select('*, reactions:message_reactions(*)')
        .eq('conversation_id', conversationId)
        // LA LIGNE '.is('deleted_at', null)' DOIT ETRE SUPPRIMEE ICI
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages((msgs || []).reverse());

      // 3. Mark conversation as read
      if (currentUser?.id) {
        directChatService.markAsRead(conversationId, currentUser.id);
      }
    } catch (e) {
      console.warn('Load messages error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUser]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  /**
   * Realtime Channel Subscriptions for Messages, Reactions & Vanish Mode
   */
  useEffect(() => {
    if (!conversationId || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const msg = payload.new;
        if (!msg) return;
        if (msg.sender_id === currentUser?.id) return;

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (msg.sender_id !== currentUser?.id) {
          soundEngine.playPopSound();
          if (currentUser?.id) {
            directChatService.markAsRead(conversationId, currentUser.id);
          }
        }
      })
      .on('broadcast', { event: 'reaction_added' }, ({ payload }) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === payload.messageId) {
              const reactions = m.reactions || [];
              if (!reactions.some((r) => r.user_id === payload.userId && r.emoji === payload.emoji)) {
                return { ...m, reactions: [...reactions, { user_id: payload.userId, emoji: payload.emoji }] };
              }
            }
            return m;
          })
        );
      })
      .on('broadcast', { event: 'reaction_removed' }, ({ payload }) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === payload.messageId) {
              const reactions = (m.reactions || []).filter(
                (r) => !(r.user_id === payload.userId && r.emoji === payload.emoji)
              );
              return { ...m, reactions };
            }
            return m;
          })
        );
      })
      .on('broadcast', { event: 'vanish_mode_toggled' }, ({ payload }) => {
        setIsVanishMode(payload.enabled);
        if (!payload.enabled) {
          // Vanish mode turned off -> remove vanished messages from local view
          setMessages((prev) => prev.filter((m) => !m.is_vanished));
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [conversationId, currentUser]);

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

    setMessages((prev) => [...prev, optimisticMsg]);
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
      setMessages((prev) => prev.map((m) => (m.id === tempId ? savedRecord : m)));
    } catch (err) {
      console.error("Message could not be sent:", err);
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      window.dispatchEvent(new CustomEvent('show_toast', { detail: { title: 'Erreur', message: 'Impossible d\'envoyer le message.' } }));
    }
  }, [conversationId, currentUser, isVanishMode, replyingTo, partner]);

  /**
   * Toggle Emoji Reaction
   */
  const toggleReaction = useCallback(async (messageId, emoji) => {
    if (!currentUser?.id) return;
    soundEngine.playPopSound();

    // Optimistic reaction update
    setMessages((prev) =>
      prev.map((m) => {
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
      })
    );

    await directChatService.toggleReaction(messageId, currentUser.id, emoji, conversationId);
  }, [currentUser, conversationId]);

  /**
   * Toggle Vanish Mode
   */
  const toggleVanishMode = useCallback(async () => {
    soundEngine.playPopSound();
    const nextState = !isVanishMode;
    setIsVanishMode(nextState);

    await directChatService.toggleVanishMode(conversationId, nextState);
    if (!nextState) {
      setMessages((prev) => prev.filter((m) => !m.is_vanished));
    }
  }, [conversationId, isVanishMode]);

  return {
    messages,
    isLoading,
    isVanishMode,
    replyingTo,
    setReplyingTo,
    sendMessage,
    toggleReaction,
    toggleVanishMode,
    refreshMessages: loadMessages
  };
}
