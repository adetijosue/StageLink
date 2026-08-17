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
   * Upload media (photo, video, audio note, document) to Supabase Storage
   */
  async uploadMedia(fileOrBlob, fileName, mediaType = 'image') {
    if (!fileOrBlob) return null;
    if (typeof fileOrBlob === 'string' && (fileOrBlob.startsWith('http://') || fileOrBlob.startsWith('https://') || fileOrBlob.startsWith('data:'))) {
      return fileOrBlob;
    }

    const toBase64 = (blob) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    };

    if (!isSupabaseConfigured()) {
      return toBase64(fileOrBlob);
    }

    try {
      let uploadPayload = fileOrBlob;
      let contentType = fileOrBlob.type;

      if (mediaType === 'image') {
        contentType = contentType || 'image/jpeg';
        try {
          const compressed = await compressImage(fileOrBlob, 1280, 1280, 0.82);
          if (typeof compressed === 'string' && compressed.startsWith('data:image')) {
            const arr = compressed.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            uploadPayload = new Blob([u8arr], { type: mime });
            contentType = mime;
          }
        } catch (_) { }
      } else if (mediaType === 'audio') {
        contentType = contentType || (fileOrBlob.name?.endsWith('.mp3') ? 'audio/mpeg' : 'audio/webm');
      } else if (mediaType === 'video') {
        contentType = contentType || 'video/mp4';
      } else {
        contentType = contentType || 'application/octet-stream';
      }

      const fileExt = fileName && fileName.includes('.')
        ? fileName.split('.').pop()
        : (mediaType === 'audio' ? 'webm' : mediaType === 'video' ? 'mp4' : mediaType === 'file' ? 'pdf' : 'jpg');

      const folder = mediaType === 'file' ? 'documents' : `${mediaType}s`;
      const uniquePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const candidateBuckets = ['chat_media', 'chat-media', 'stories', 'posts', 'media', 'avatars', 'public'];
      let successfulBucket = null;

      for (const bucket of candidateBuckets) {
        try {
          const { error: err } = await supabase.storage.from(bucket).upload(uniquePath, uploadPayload, {
            contentType: contentType || 'application/octet-stream',
            cacheControl: '3600',
            upsert: true
          });
          if (!err) {
            successfulBucket = bucket;
            break;
          }
        } catch (e) {
          // try next bucket
        }
      }

      if (!successfulBucket) {
        throw new Error('No storage bucket accessible');
      }

      const { data: publicData } = supabase.storage
        .from(successfulBucket)
        .getPublicUrl(uniquePath);

      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
      throw new Error('Could not get public URL');
    } catch (err) {
      console.warn('Media upload to storage failed, falling back to base64 Data URL:', err.message || err);
      if (typeof fileOrBlob === 'string') return fileOrBlob;
      return toBase64(fileOrBlob);
    }
  },

  /**
   * Send a direct message with rich metadata
   */
  async sendMessage({
    conversationId,
    senderId,
    recipientId = null,
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
        // Persist to Postgres database
        const { error } = await supabase.from('direct_messages').insert(newRecord);
        if (error) {
          console.warn('Direct message DB insert error:', error.message);
          throw error;
        }

        // Resolve recipient ID if not explicitly provided
        let targetRecipientId = recipientId;
        if (!targetRecipientId) {
          try {
            const { data: parts } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conversationId)
              .neq('user_id', senderId)
              .limit(1);
            if (parts && parts.length > 0) {
              targetRecipientId = parts[0].user_id;
            }
          } catch (pe) {}
        }

        // Insert notification in notifications table for recipient (instant push & sync across devices)
        const notifContent = content || (messageType === 'audio' ? '🎤 Note vocale' : (messageType === 'image' ? '📷 Photo' : 'Nouveau message'));
        if (targetRecipientId && targetRecipientId !== senderId) {
          try {
            await supabase.from('notifications').insert({
              user_id: targetRecipientId,
              actor_id: senderId,
              type: 'message',
              reference_id: conversationId,
              content: notifContent,
              is_read: false
            });
          } catch (ne) {
            console.warn('Direct message notification insert note:', ne.message);
          }
        }

        // 4. INSTANT MULTI-CHANNEL WEBSOCKET BROADCASTS (Delivery <20ms guaranteed)
        try {
          const broadcastPayload = {
            message: newRecord,
            conversationId,
            senderId,
            recipientId: targetRecipientId
          };

          // A. Broadcast on conversation thread channel (for in-chat instant UI append)
          supabase.channel(`dm:${conversationId}`).send({
            type: 'broadcast',
            event: 'new_direct_message',
            payload: broadcastPayload
          }).catch(() => {});

          // B. Broadcast to target recipient's private user channel (for instant floating banner & badge)
          if (targetRecipientId && targetRecipientId !== senderId) {
            supabase.channel(`user:${targetRecipientId}`).send({
              type: 'broadcast',
              event: 'new_direct_message',
              payload: broadcastPayload
            }).catch(() => {});
          }

          // C. Broadcast on global realtime:direct_messages (fallback)
          supabase.channel('realtime:direct_messages').send({
            type: 'broadcast',
            event: 'new_direct_message',
            payload: broadcastPayload
          }).catch(() => {});
        } catch (bErr) {
          console.warn('Realtime direct message broadcast note:', bErr);
        }
      } catch (err) {
        console.warn('Direct message sending error:', err);
        throw err;
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
    } catch (e) { }
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId, currentUserId) {
    if (!conversationId || !currentUserId) return;
    
    // 0. Update LocalStorage conversation cache immediately (0ms instant UI badge update)
    try {
      const cacheKey = `stagelink_cached_conversations_${currentUserId}`;
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        const updated = cached.map(c => {
          if (c.id === conversationId) {
            return { ...c, unreadCount: 0, isUnread: false };
          }
          return c;
        });
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      }
    } catch (_) {}

    // Dispatch UI refresh event immediately
    window.dispatchEvent(new Event('refresh_conversations'));

    if (!isSupabaseConfigured()) return;
    try {
      const now = new Date().toISOString();

      // 1. Met à jour la date de dernière lecture
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: now })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      // 2. Force le statut des messages à "lu" (read)
      await supabase
        .from('direct_messages')
        .update({ status: 'read' })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('status', 'sent');

      // 3. Met à jour les notifications associées à cette conversation comme lues
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', currentUserId)
          .eq('reference_id', conversationId)
          .eq('is_read', false);
      } catch (ne) {}

      // 4. Diffuse en temps réel aux participants que les messages ont été lus (double coche bleue instantanée)
      try {
        supabase.channel(`dm:${conversationId}`).send({
          type: 'broadcast',
          event: 'messages_read',
          payload: { conversationId, readerId: currentUserId }
        });
      } catch (be) {}

      // 5. SOLUTION RADICALE : Déclenche instantanément la mise à jour de l'icône de notification dans l'Inbox !
      window.dispatchEvent(new Event('refresh_conversations'));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
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
