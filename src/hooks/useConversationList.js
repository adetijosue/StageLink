import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { directChatService } from '../services/directChatService';

export function useConversationList(currentUser) {
  const [conversations, setConversations] = useState([]);
  const [directNotes, setDirectNotes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'groups'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch Conversations & Direct Notes
   */
  const loadInboxData = useCallback(async () => {
    if (!currentUser?.id || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch 24h Direct Notes
      const notes = await directChatService.fetchActiveNotes();
      setDirectNotes(notes);

      // 2. Fetch Conversations where current user is participant
      const { data: participants, error: partErr } = await supabase
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

      if (partErr) throw partErr;

      const formatted = (participants || []).map((item) => {
        const conv = item.conversation;
        if (!conv) return null;

        // Find partner profile for 1:1 direct chat
        const otherPartObj = conv.participants?.find((p) => p.user_id !== currentUser.id);
        const otherParticipant = Array.isArray(otherPartObj?.profile) ? otherPartObj.profile[0] : otherPartObj?.profile;
        
        const sortedMsgs = Array.isArray(conv.last_message)
          ? [...conv.last_message].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          : [];
        const lastMsg = sortedMsgs[0] || null;

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
          updatedAt: conv.updated_at,
          unreadCount: isUnread ? 1 : 0
        };
      }).filter(Boolean);

      setConversations(formatted);
    } catch (e) {
      console.warn('Load inbox data note:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadInboxData();
    
    const handleRefresh = () => loadInboxData();
    window.addEventListener('refresh_conversations', handleRefresh);

    if (!isSupabaseConfigured() || !currentUser?.id) {
      return () => window.removeEventListener('refresh_conversations', handleRefresh);
    }

    // Real-time synchronization across all devices and background tabs
    const channel = supabase
      .channel(`inbox_sync_${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages'
      }, () => {
        loadInboxData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        loadInboxData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_notes'
      }, () => {
        loadInboxData();
      })
      .subscribe();

    return () => {
      window.removeEventListener('refresh_conversations', handleRefresh);
      supabase.removeChannel(channel);
    };
  }, [loadInboxData, currentUser?.id]);

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
      setDirectNotes((prev) => [
        {
          ...note,
          user: {
            id: currentUser.id,
            full_name: currentUser.name || currentUser.full_name,
            avatar_url: currentUser.avatar || currentUser.avatar_url
          }
        },
        ...prev.filter((n) => n.user_id !== currentUser.id)
      ]);
    }
  }, [currentUser]);

  // Filter conversations based on search and active tab
  const filteredConversations = conversations.filter((conv) => {
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
    refreshInbox: loadInboxData
  };
}
