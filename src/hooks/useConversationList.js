import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { directChatService } from '../services/directChatService';

export function useConversationList(currentUser) {
  // 1. Instant Cache-First Initialization (0ms latency)
  const [conversations, setConversations] = useState(() => {
    if (!currentUser?.id) return [];
    try {
      const convMap = new Map();
      const cached = localStorage.getItem(`stagelink_cached_conversations_${currentUser.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          parsed.forEach(c => {
            const key = c.partner?.id || c.participant?.id || c.id;
            if (key && c.lastMessage) convMap.set(key, c);
          });
        }
      }

      const rawChats = localStorage.getItem('stagelink_chats');
      if (rawChats) {
        const parsedChats = JSON.parse(rawChats);
        if (Array.isArray(parsedChats)) {
          parsedChats.forEach(chat => {
            if (chat && (chat.participant || chat.partner)) {
              const partnerObj = chat.participant || chat.partner;
              const key = partnerObj.id || chat.id;
              if (key && !convMap.has(key)) {
                const lastM = Array.isArray(chat.messages) && chat.messages.length > 0
                  ? chat.messages[chat.messages.length - 1]
                  : (chat.lastMessage ? (typeof chat.lastMessage === 'string' ? { content: chat.lastMessage, created_at: chat.updatedAt || new Date().toISOString() } : chat.lastMessage) : null);

                if (lastM) {
                  convMap.set(key, {
                    id: chat.id || `conv_${partnerObj.id}`,
                    type: 'direct',
                    title: partnerObj.name || partnerObj.full_name || 'Artiste',
                    avatar: partnerObj.avatar || partnerObj.avatar_url || '',
                    partner: partnerObj,
                    participant: partnerObj,
                    lastMessage: lastM,
                    updatedAt: chat.updatedAt || new Date().toISOString(),
                    unreadCount: chat.unread || chat.unreadCount || 0
                  });
                }
              }
            }
          });
        }
      }

      return Array.from(convMap.values());
    } catch (e) {
      console.warn("Storage read error (conversations):", e);
      return [];
    }
  });

  const [directNotes, setDirectNotes] = useState(() => {
    if (!currentUser?.id) return [];
    try {
      const cached = localStorage.getItem(`stagelink_cached_notes_${currentUser.id}`);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.warn("Storage read error (notes):", e);
      return [];
    }
  });

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'groups'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(() => {
    if (!currentUser?.id) return false;
    try {
      const cached = localStorage.getItem(`stagelink_cached_conversations_${currentUser.id}`);
      return !cached || JSON.parse(cached).length === 0;
    } catch (e) {
      console.warn("Storage read error (initial loading state):", e);
      return true;
    }
  });

  const isMountedRef = useRef(true);
  const initialLoadRef = useRef(conversations.length > 0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch Conversations & Direct Notes with Background Revalidation (SWR)
   */
  const loadInboxData = useCallback(async (silent = false) => {
    if (!currentUser?.id || !isSupabaseConfigured()) {
      if (isMountedRef.current) setIsLoading(false);
      return;
    }

    if (!silent && conversations.length === 0) {
      setIsLoading(true);
    }

    try {
      // 1. Fetch 24h Direct Notes
      const notesPromise = directChatService.fetchActiveNotes().catch(() => []);

      // 2. Fetch Conversations where current user is participant
      const convPromise = (async () => {
        try {
          return await supabase
            .from('conversation_participants')
            .select(`
              conversation_id,
              last_read_at,
              conversation:conversations(
                id,
                type,
                title,
                avatar_url,
                vanish_mode_enabled,
                updated_at,
                last_message_at,
                participants:conversation_participants(
                  user_id,
                  profile:user_id(id, full_name, username, avatar_url, role, verified_badge)
                ),
                last_message:direct_messages(
                  id,
                  sender_id,
                  message_type,
                  content,
                  media_url,
                  created_at
                )
              )
            `)
            .eq('user_id', currentUser.id)
            .is('left_at', null)
            .limit(50);
        } catch (e) {
          return { data: [], error: e };
        }
      })();

      // 3. Fetch deleted chat states in Supabase
      const statesPromise = (async () => {
        try {
          return await supabase
            .from('chat_states')
            .select('partner_id, is_deleted')
            .eq('user_id', currentUser.id)
            .eq('is_deleted', true);
        } catch (e) {
          return { data: [] };
        }
      })();

      // 4. Fetch live messages from messages table in Supabase
      const messagesTablePromise = (async () => {
        try {
          return await supabase
            .from('messages')
            .select('*, sender:sender_id(id, full_name, username, avatar_url, role), recipient:receiver_id(id, full_name, username, avatar_url, role)')
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false })
            .limit(100);
        } catch (e) {
          return { data: [] };
        }
      })();

      // 5. Fetch message notifications to recover conversations from incoming notifications
      const notifsPromise = (async () => {
        try {
          return await supabase
            .from('notifications')
            .select('*, actor:actor_id(id, full_name, username, avatar_url, role)')
            .eq('user_id', currentUser.id)
            .eq('type', 'message')
            .order('created_at', { ascending: false })
            .limit(30);
        } catch (e) {
          return { data: [] };
        }
      })();

      const [notes, { data: participants, error: partErr }, { data: statesData }, { data: supaMessages }, { data: supaNotifs }] = await Promise.all([
        notesPromise,
        convPromise,
        statesPromise,
        messagesTablePromise,
        notifsPromise
      ]);

      if (notes && isMountedRef.current) {
        setDirectNotes(notes);
        try {
          localStorage.setItem(`stagelink_cached_notes_${currentUser.id}`, JSON.stringify(notes));
        } catch (e) {
          console.warn("Storage write error (notes):", e);
        }
      }

      if (partErr) {
        console.warn('Supabase conversations fetch note:', partErr.message || partErr);
      }

      // Helper to extract locally cached discussions
      let localCachedConvs = [];
      try {
        const rawCached = localStorage.getItem(`stagelink_cached_conversations_${currentUser.id}`);
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (Array.isArray(parsed)) localCachedConvs = parsed;
        }
      } catch (_) {}

      try {
        const rawChats = localStorage.getItem('stagelink_chats');
        if (rawChats) {
          const parsedChats = JSON.parse(rawChats);
          if (Array.isArray(parsedChats)) {
            parsedChats.forEach(chat => {
              if (chat && chat.participant && !localCachedConvs.some(c => c.id === chat.id || (c.partner && c.partner.id === chat.participant.id))) {
                const partnerObj = chat.participant;
                const lastM = Array.isArray(chat.messages) && chat.messages.length > 0
                  ? chat.messages[chat.messages.length - 1]
                  : (chat.lastMessage ? { content: typeof chat.lastMessage === 'string' ? chat.lastMessage : chat.lastMessage.text || '', created_at: chat.updatedAt || new Date().toISOString() } : null);

                if (lastM) {
                  localCachedConvs.push({
                    id: chat.id || `conv_${partnerObj.id}`,
                    type: 'direct',
                    title: partnerObj.name || partnerObj.full_name || 'Artiste',
                    avatar: partnerObj.avatar || partnerObj.avatar_url || '',
                    partner: partnerObj,
                    participant: partnerObj,
                    lastMessage: lastM,
                    updatedAt: chat.updatedAt || new Date().toISOString(),
                    unreadCount: chat.unread || 0
                  });
                }
              }
            });
          }
        }
      } catch (_) {}

      const deletedPartnerIds = new Set((statesData || []).map(s => String(s.partner_id)));

      // Process discussions from conversations table
      const remoteFormatted = (participants || []).map((item) => {
        const conv = item.conversation;
        if (!conv) return null;

        // Find partner profile for 1:1 direct chat
        const otherPartObj = conv.participants?.find((p) => p.user_id !== currentUser.id);
        const otherParticipant = Array.isArray(otherPartObj?.profile) ? otherPartObj.profile[0] : otherPartObj?.profile;
        const partnerId = otherParticipant?.id || otherPartObj?.user_id;

        // Filter out if user previously marked this discussion as deleted
        if (partnerId && deletedPartnerIds.has(String(partnerId))) {
          return null;
        }
        
        const sortedMsgs = Array.isArray(conv.last_message)
          ? [...conv.last_message].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          : [];
        const lastMsg = sortedMsgs[0] || null;

        if (!lastMsg) {
          return null;
        }

        const partnerName = otherParticipant?.full_name || otherParticipant?.username || otherParticipant?.name || 'Artiste';
        const partnerUsername = otherParticipant?.username || '';
        const partnerAvatar = otherParticipant?.avatar_url || otherParticipant?.avatar || '';
        const partnerRole = otherParticipant?.role || otherParticipant?.userRole || 'Artiste';

        const normalizedPartner = otherParticipant ? {
          ...otherParticipant,
          id: otherParticipant.id || otherPartObj?.user_id,
          full_name: partnerName,
          name: partnerName,
          username: partnerUsername,
          avatar_url: partnerAvatar,
          avatar: partnerAvatar,
          role: partnerRole,
          userRole: partnerRole
        } : (otherPartObj?.user_id ? {
          id: otherPartObj.user_id,
          full_name: 'Artiste',
          name: 'Artiste',
          username: '',
          avatar_url: '',
          avatar: '',
          role: 'Artiste',
          userRole: 'Artiste'
        } : null);

        const isLastMsgFromMe = Boolean(lastMsg && lastMsg.sender_id === currentUser.id);
        const isUnread = Boolean(
          lastMsg &&
          !isLastMsgFromMe &&
          (!item.last_read_at || new Date(lastMsg.created_at) > new Date(item.last_read_at))
        );

        return {
          id: conv.id,
          type: conv.type,
          title: conv.type === 'group' ? conv.title : partnerName,
          avatar: conv.type === 'group' ? conv.avatar_url : partnerAvatar,
          partner: normalizedPartner,
          participant: normalizedPartner,
          participants: conv.participants,
          vanishModeEnabled: conv.vanish_mode_enabled,
          lastMessage: lastMsg,
          updatedAt: conv.updated_at || lastMsg.created_at,
          unreadCount: isUnread ? 1 : 0
        };
      }).filter(Boolean);

      // Process discussions from messages table
      const messagesFormatted = [];
      if (Array.isArray(supaMessages) && supaMessages.length > 0) {
        const grouped = new Map();
        supaMessages.forEach(msg => {
          const isMeSender = msg.sender_id === currentUser.id;
          const partnerId = isMeSender ? msg.receiver_id : msg.sender_id;
          if (!partnerId || deletedPartnerIds.has(String(partnerId))) return;

          if (!grouped.has(partnerId)) {
            grouped.set(partnerId, []);
          }
          grouped.get(partnerId).push(msg);
        });

        grouped.forEach((msgs, partnerId) => {
          const latestMsg = msgs[0];
          const isMe = latestMsg.sender_id === currentUser.id;
          const partnerProfile = isMe ? latestMsg.recipient : latestMsg.sender;
          const partnerName = partnerProfile?.full_name || partnerProfile?.username || 'Artiste';
          const partnerAvatar = partnerProfile?.avatar_url || '';
          const partnerRole = partnerProfile?.role || 'Artiste';

          const normalizedPartner = {
            id: partnerId,
            full_name: partnerName,
            name: partnerName,
            username: partnerProfile?.username || '',
            avatar: partnerAvatar,
            avatar_url: partnerAvatar,
            role: partnerRole,
            userRole: partnerRole
          };

          const unread = msgs.some(m => m.sender_id !== currentUser.id && m.is_read === false);

          messagesFormatted.push({
            id: `chat_${partnerId}`,
            type: 'direct',
            title: partnerName,
            avatar: partnerAvatar,
            partner: normalizedPartner,
            participant: normalizedPartner,
            lastMessage: {
              id: latestMsg.id,
              sender_id: latestMsg.sender_id,
              content: latestMsg.content || latestMsg.text || '',
              media_url: latestMsg.media_url,
              created_at: latestMsg.created_at
            },
            updatedAt: latestMsg.created_at,
            unreadCount: unread ? 1 : 0
          });
        });
      }

      // Process discussions from message notifications
      const notifsFormatted = [];
      if (Array.isArray(supaNotifs) && supaNotifs.length > 0) {
        supaNotifs.forEach(notif => {
          const partnerId = notif.actor_id;
          if (!partnerId || deletedPartnerIds.has(String(partnerId))) return;
          if (notifsFormatted.some(n => n.partner?.id === partnerId)) return;

          const actorProfile = Array.isArray(notif.actor) ? notif.actor[0] : notif.actor;
          const partnerName = actorProfile?.full_name || actorProfile?.username || 'Artiste';
          const partnerAvatar = actorProfile?.avatar_url || '';
          const partnerRole = actorProfile?.role || 'Artiste';

          const normalizedPartner = {
            id: partnerId,
            full_name: partnerName,
            name: partnerName,
            username: actorProfile?.username || '',
            avatar: partnerAvatar,
            avatar_url: partnerAvatar,
            role: partnerRole,
            userRole: partnerRole
          };

          notifsFormatted.push({
            id: notif.reference_id || `chat_${partnerId}`,
            type: 'direct',
            title: partnerName,
            avatar: partnerAvatar,
            partner: normalizedPartner,
            participant: normalizedPartner,
            lastMessage: {
              id: notif.id,
              sender_id: partnerId,
              content: notif.content || 'Nouveau message',
              created_at: notif.created_at
            },
            updatedAt: notif.created_at,
            unreadCount: notif.is_read === false ? 1 : 0
          });
        });
      }

      // Merge remote, messages, notifications, and local discussions seamlessly with deduplication by partner ID
      const convMap = new Map();
      remoteFormatted.forEach(c => {
        const key = c.partner?.id || c.id;
        if (key) convMap.set(key, c);
      });
      messagesFormatted.forEach(c => {
        const key = c.partner?.id || c.id;
        if (key && !convMap.has(key)) {
          convMap.set(key, c);
        }
      });
      notifsFormatted.forEach(c => {
        const key = c.partner?.id || c.id;
        if (key && !convMap.has(key)) {
          convMap.set(key, c);
        }
      });
      localCachedConvs.forEach(c => {
        const key = c.partner?.id || c.id;
        if (key && !convMap.has(key)) {
          convMap.set(key, c);
        }
      });

      const finalConversations = Array.from(convMap.values()).sort((a, b) => {
        const timeA = new Date(a.lastMessage?.created_at || a.updatedAt || 0).getTime();
        const timeB = new Date(b.lastMessage?.created_at || b.updatedAt || 0).getTime();
        return timeB - timeA;
      });

      const totalUnreadCount = finalConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      try {
        window.dispatchEvent(new CustomEvent('unread_count_updated', { detail: { count: totalUnreadCount } }));
      } catch (_) {}

      if (isMountedRef.current) {
        setConversations(finalConversations);
        try {
          localStorage.setItem(`stagelink_cached_conversations_${currentUser.id}`, JSON.stringify(finalConversations));
        } catch (e) {
          console.warn("Storage write error (conversations):", e);
        }
      }
    } catch (e) {
      console.warn('Load inbox data note:', e);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    // Initial fetch (silent if we already have cached conversations for 0ms instant display)
    loadInboxData(initialLoadRef.current);
    
    const handleRefresh = () => loadInboxData(true);
    window.addEventListener('refresh_conversations', handleRefresh);
    
    const handleLocalUpdate = (e) => {
      if (e.detail?.conversationId) {
        setConversations(prev => {
          const nextList = prev.map(c => {
             if (c.id === e.detail.conversationId) {
                 return { ...c, unreadCount: e.detail.unreadCount ?? c.unreadCount };
             }
             return c;
          });
          try { localStorage.setItem(`stagelink_cached_conversations_${currentUser.id}`, JSON.stringify(nextList)); } catch(err) {}
          return nextList;
        });
      }
    };
    window.addEventListener('update_conversation_local', handleLocalUpdate);

    const handleDeleted = (e) => {
      const convId = e.detail?.conversationId;
      const partId = e.detail?.partnerId;
      if (convId || partId) {
        setConversations(prev => {
          const nextList = prev.filter(c => {
            if (convId && String(c.id) === String(convId)) return false;
            const cPartnerId = c.partner?.id || c.participant?.id || c.partnerId;
            if (partId && cPartnerId && String(cPartnerId) === String(partId)) return false;
            return true;
          });
          try { localStorage.setItem(`stagelink_cached_conversations_${currentUser.id}`, JSON.stringify(nextList)); } catch(err) {}
          return nextList;
        });
      }
    };
    window.addEventListener('conversation_deleted', handleDeleted);

    if (!isSupabaseConfigured() || !currentUser?.id) {
      window.removeEventListener('refresh_conversations', handleRefresh);
      window.removeEventListener('update_conversation_local', handleLocalUpdate);
      window.removeEventListener('conversation_deleted', handleDeleted);
      return;
    }

    // Real-time synchronization across all devices and background tabs
    const channel = supabase
      .channel(`inbox_sync_${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newMsg = payload.new;
          setConversations(prev => {
            const convIdx = prev.findIndex(c => String(c.id) === String(newMsg.conversation_id));
            if (convIdx === -1) {
              // New conversation not in list, need to fetch
              loadInboxData(true);
              return prev;
            }
            
            const updatedConv = { ...prev[convIdx] };
            updatedConv.lastMessage = newMsg;
            updatedConv.updatedAt = newMsg.created_at;
            if (newMsg.sender_id !== currentUser.id) {
              updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
            }
            
            // Move to top
            const nextList = [updatedConv, ...prev.slice(0, convIdx), ...prev.slice(convIdx + 1)];
            
            try {
              localStorage.setItem(`stagelink_cached_conversations_${currentUser.id}`, JSON.stringify(nextList));
            } catch(e) {}
            
            return nextList;
          });
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedMsg = payload.new;
          setConversations(prev => {
            const convIdx = prev.findIndex(c => String(c.id) === String(updatedMsg.conversation_id));
            if (convIdx === -1) return prev;
            
            const conv = prev[convIdx];
            if (conv.lastMessage?.id === updatedMsg.id) {
               const nextList = [...prev];
               nextList[convIdx] = { ...conv, lastMessage: updatedMsg };
               try { localStorage.setItem(`stagelink_cached_conversations_${currentUser.id}`, JSON.stringify(nextList)); } catch(e) {}
               return nextList;
            }
            return prev;
          });
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        loadInboxData(true);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_notes'
      }, () => {
        loadInboxData(true);
      })
      .subscribe();

    return () => {
      window.removeEventListener('refresh_conversations', handleRefresh);
      window.removeEventListener('update_conversation_local', handleLocalUpdate);
      window.removeEventListener('conversation_deleted', handleDeleted);
      supabase.removeChannel(channel);
    };
  }, [loadInboxData, currentUser?.id]);

  /**
   * Delete / leave a conversation
   */
  const deleteConversation = useCallback(async (conversationId, convObj = null) => {
    if (!conversationId || !currentUser?.id) return { success: false };
    
    const partnerId = convObj?.partner?.id || convObj?.participant?.id || convObj?.partnerId || (
      String(conversationId).startsWith('conv_') ? String(conversationId).replace('conv_', '') : (
        String(conversationId).startsWith('chat_') ? String(conversationId).replace('chat_', '') : null
      )
    );

    // 1. Instant optimistic local state update (0ms latency)
    setConversations(prev => {
      const nextList = prev.filter(c => {
        if (String(c.id) === String(conversationId)) return false;
        const cPartnerId = c.partner?.id || c.participant?.id || c.partnerId;
        if (partnerId && cPartnerId && String(cPartnerId) === String(partnerId)) return false;
        return true;
      });
      try {
        localStorage.setItem(`stagelink_cached_conversations_${currentUser.id}`, JSON.stringify(nextList));
      } catch (e) {}
      return nextList;
    });

    // 2. Persist removal to database & storage
    return await directChatService.deleteConversation(conversationId, currentUser.id, partnerId);
  }, [currentUser?.id]);

  /**
   * Post a new Direct Note
   */
  const postNote = useCallback(async ({ content, audioTrackUrl, audioTrackTitle, audioTrackArtist }) => {
    if (!currentUser?.id) return;
    const note = await directChatService.postDirectNote(currentUser.id, {
      content,
      audioTrackUrl,
      audioTrackTitle,
      audioTrackArtist
    });
    if (note) {
      setDirectNotes((prev) => {
        const next = [
          {
            ...note,
            user: {
              id: currentUser.id,
              full_name: currentUser.name || currentUser.full_name,
              avatar_url: currentUser.avatar || currentUser.avatar_url
            }
          },
          ...prev.filter((n) => n.user_id !== currentUser.id)
        ];
        try {
          localStorage.setItem(`stagelink_cached_notes_${currentUser.id}`, JSON.stringify(next));
        } catch (e) {
          console.warn("Storage write error (post note):", e);
        }
        return next;
      });
    }
  }, [currentUser]);

  // Filter conversations based on search and active tab
  const filteredConversations = conversations.filter((conv) => {
    // Exclude conversations with no messages
    if (!conv || !conv.lastMessage) return false;

    const matchesSearch = (conv.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'unread') return conv.unreadCount > 0;
    if (activeFilter === 'groups') return conv.type === 'group';
    return true;
  });

  return {
    conversations: filteredConversations,
    directNotes,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    postNote,
    deleteConversation,
    refreshInbox: () => loadInboxData(false)
  };
}
