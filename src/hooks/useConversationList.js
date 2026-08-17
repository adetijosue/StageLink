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
              profile:profiles(id, full_name, avatar_url, role, verified_badge)
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
        const otherParticipant = conv.participants?.find((p) => p.user_id !== currentUser.id)?.profile;
        const lastMsg = conv.last_message && conv.last_message.length > 0
          ? conv.last_message[conv.last_message.length - 1]
          : null;

        return {
          id: conv.id,
          type: conv.type,
          title: conv.type === 'group' ? conv.title : (otherParticipant?.full_name || 'Artiste StageLink'),
          avatar: conv.type === 'group' ? conv.avatar_url : (otherParticipant?.avatar_url || ''),
          partner: otherParticipant,
          vanishModeEnabled: conv.vanish_mode_enabled,
          lastMessage: lastMsg,
          updatedAt: conv.updated_at,
          unreadCount: lastMsg && (!item.last_read_at || new Date(lastMsg.created_at) > new Date(item.last_read_at)) ? 1 : 0
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
    return () => window.removeEventListener('refresh_conversations', handleRefresh);
  }, [loadInboxData]);

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
