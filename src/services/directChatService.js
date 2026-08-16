import { supabase, isSupabaseConfigured } from './supabaseClient';
import { compressImage } from '../utils/imageCompressor';

/**
 * StageLink Instagram-Grade Direct Messaging Service
 * Powered by JABE PRODUCTION
 */

export const directChatService = {
  /**
   * Create or get an existing 1:1 conversation
   */
  async getOrCreateDirectConversation(partnerId) {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        conversation_id: `conv_${partnerId}`,
        type: 'direct',
        vanish_mode_enabled: false
      };
    }

    try {
      const { data, error } = await supabase.rpc('create_or_get_direct_conversation', {
        p_partner_id: partnerId
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('RPC create_or_get_direct_conversation fallback:', err.message);
      return {
        success: true,
        conversation_id: `conv_${partnerId}`,
        type: 'direct',
        vanish_mode_enabled: false
      };
    }
  },

  /**
   * Upload media (photo, video, audio note) to Supabase Storage 'chat-media'
   */
  async uploadMedia(fileOrBlob, fileName, mediaType = 'image') {
    if (!isSupabaseConfigured()) {
      // Offline fallback: Return base64 URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(fileOrBlob);
      });
    }

    try {
      let uploadPayload = fileOrBlob;
      let contentType = fileOrBlob.type || 'application/octet-stream';

      // Compress image client-side if image
      if (mediaType === 'image' && fileOrBlob.type?.startsWith('image/')) {
        try {
          const compressed = await compressImage(fileOrBlob, 1280, 1280, 0.82);
          uploadPayload = compressed;
          contentType = 'image/jpeg';
        } catch (e) {}
      }

      const fileExt = fileName ? fileName.split('.').pop() : (mediaType === 'audio' ? 'webm' : 'jpg');
      const uniquePath = `${mediaType}s/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(uniquePath, uploadPayload, {
          contentType,
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(uniquePath);

      return publicData.publicUrl;
    } catch (err) {
      console.warn('Media upload to storage failed, falling back to base64:', err.message);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(fileOrBlob);
      });
    }
  },

  /**
   * Send a direct message with rich metadata
   */
  async sendMessage({
    conversationId,
    senderId,
    content = '',
    messageType = 'text',
    mediaUrl = null,
    metadata = {},
    replyToId = null,
    isVanished = false
  }) {
    const msgId = crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newRecord = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: messageType,
      content,
      media_url: mediaUrl,
      metadata,
      reply_to_id: replyToId,
      status: 'sent',
      is_vanished: isVanished,
      created_at: now,
      updated_at: now
    };

    if (isSupabaseConfigured()) {
      try {
        // Broadcast on realtime channel for sub-10ms UI sync
        supabase.channel(`dm:${conversationId}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: newRecord
        });

        // Persist to Postgres database
        const { error } = await supabase.from('direct_messages').insert(newRecord);
        if (error) console.warn('Direct message DB insert note:', error.message);
      } catch (err) {
        console.warn('Direct message sending error:', err);
      }
    }

    return newRecord;
  },

  /**
   * Toggle emoji reaction on a message
   */
  async toggleReaction(messageId, userId, emoji, conversationId) {
    if (!isSupabaseConfigured()) return { action: 'added', emoji };

    try {
      // Check if reaction already exists for this user and emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from('message_reactions').delete().eq('id', existing.id);
        if (conversationId) {
          supabase.channel(`dm:${conversationId}`).send({
            type: 'broadcast',
            event: 'reaction_removed',
            payload: { messageId, userId, emoji }
          });
        }
        return { action: 'removed', emoji };
      } else {
        await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: userId,
          emoji
        });
        if (conversationId) {
          supabase.channel(`dm:${conversationId}`).send({
            type: 'broadcast',
            event: 'reaction_added',
            payload: { messageId, userId, emoji }
          });
        }
        return { action: 'added', emoji };
      }
    } catch (e) {
      console.warn('Toggle reaction error:', e);
      return { action: 'added', emoji };
    }
  },

  /**
   * Toggle Vanish Mode for a conversation
   */
  async toggleVanishMode(conversationId, enabled) {
    if (!isSupabaseConfigured()) return enabled;

    try {
      await supabase.rpc('toggle_vanish_mode', {
        p_conversation_id: conversationId,
        p_enabled: enabled
      });

      supabase.channel(`dm:${conversationId}`).send({
        type: 'broadcast',
        event: 'vanish_mode_toggled',
        payload: { conversationId, enabled }
      });
      return enabled;
    } catch (e) {
      console.warn('Vanish mode toggle note:', e);
      return enabled;
    }
  },

  /**
   * Purge vanished messages on exit
   */
  async purgeVanishedMessages(conversationId) {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.rpc('purge_vanished_messages', {
        p_conversation_id: conversationId
      });
    } catch (e) {}
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId, userId) {
    if (!isSupabaseConfigured() || !conversationId) return;

    try {
      await supabase.rpc('mark_conversation_as_read', {
        p_conversation_id: conversationId
      });

      supabase.channel(`dm:${conversationId}`).send({
        type: 'broadcast',
        event: 'read_receipt',
        payload: { conversationId, userId, readAt: new Date().toISOString() }
      });
    } catch (e) {}
  },

  /**
   * Post a 24h Direct Note (with optional music track)
   */
  async postDirectNote(userId, { content, audioTrackUrl = null, audioTrackTitle = null, audioTrackArtist = null }) {
    if (!isSupabaseConfigured()) return { content, audioTrackUrl };

    try {
      const { data, error } = await supabase.from('user_direct_notes').upsert({
        user_id: userId,
        content,
        audio_track_url: audioTrackUrl,
        audio_track_title: audioTrackTitle,
        audio_track_artist: audioTrackArtist,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'user_id' }).select('*').single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Post direct note error:', e);
      return null;
    }
  },

  /**
   * Fetch active Direct Notes for all contacts
   */
  async fetchActiveNotes() {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('user_direct_notes')
        .select('*, user:profiles(id, full_name, avatar_url, role)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      return [];
    }
  }
};
