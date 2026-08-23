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
    if (!isSupabaseConfigured() || !partnerId) {
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
      if (!error && data?.conversation_id) return data;
    } catch (_) {}

    // Direct Postgres fallback
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myParts } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (myParts && myParts.length > 0) {
          const convIds = myParts.map(p => p.conversation_id);
          const { data: partnerParts } = await supabase
            .from('conversation_participants')
            .select('conversation_id, conversation:conversations(*)')
            .eq('user_id', partnerId)
            .in('conversation_id', convIds)
            .limit(1);

          if (partnerParts && partnerParts.length > 0 && partnerParts[0].conversation_id) {
            return {
              success: true,
              conversation_id: partnerParts[0].conversation_id,
              type: 'direct',
              vanish_mode_enabled: Boolean(partnerParts[0].conversation?.vanish_mode_enabled)
            };
          }
        }

        // Create new conversation in conversations table
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({ type: 'direct', vanish_mode_enabled: false })
          .select()
          .single();

        if (newConv && !convErr) {
          await supabase.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: user.id },
            { conversation_id: newConv.id, user_id: partnerId }
          ]);

          return {
            success: true,
            conversation_id: newConv.id,
            type: 'direct',
            vanish_mode_enabled: false
          };
        }
      }
    } catch (e) {
      console.warn('Direct fallback create conv note:', e?.message || e);
    }

    return {
      success: true,
      conversation_id: `conv_${partnerId}`,
      type: 'direct',
      vanish_mode_enabled: false
    };
  },

  /**
   * Automatically delete/clean up empty conversation drafts where no message was sent
   */
  async cleanupEmptyConversation(conversationId) {
    if (!conversationId || !isSupabaseConfigured()) return;
    try {
      // Check if conversation has any message
      const { data: msgs, error: msgErr } = await supabase
        .from('direct_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .limit(1);

      if (!msgErr && (!msgs || msgs.length === 0)) {
        await supabase.from('conversation_participants').delete().eq('conversation_id', conversationId);
        await supabase.from('conversations').delete().eq('id', conversationId);
      }
    } catch (err) {
      console.warn('Cleanup empty conversation note:', err?.message || err);
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

    const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str || ''));

    if (isSupabaseConfigured()) {
      try {
        // Persist to Postgres direct_messages database only if conversationId is a valid UUID
        if (isValidUUID(conversationId)) {
          const { error } = await supabase.from('direct_messages').insert(newRecord);
          if (error) {
            console.warn('Direct message DB insert note:', error.message);
          }
        }

        // Resolve recipient ID if not explicitly provided
        let targetRecipientId = recipientId;
        if (!targetRecipientId && isValidUUID(conversationId)) {
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

        // Update chat_states to un-delete conversation if previously deleted
        if (targetRecipientId && targetRecipientId !== senderId && isValidUUID(senderId) && isValidUUID(targetRecipientId)) {
          try {
            await supabase
              .from('chat_states')
              .upsert([
                { user_id: senderId, partner_id: targetRecipientId, is_deleted: false, updated_at: now },
                { user_id: targetRecipientId, partner_id: senderId, is_deleted: false, updated_at: now }
              ], { onConflict: 'user_id,partner_id' });
          } catch (_) {}
        }

        // Insert notification in notifications table for recipient (instant push & sync across devices)
        const notifContent = content || (messageType === 'audio' ? '🎤 Note vocale' : (messageType === 'image' ? '📷 Photo' : 'Nouveau message'));
        if (targetRecipientId && targetRecipientId !== senderId && isValidUUID(targetRecipientId) && isValidUUID(senderId)) {
          try {
            await supabase.from('notifications').insert({
              user_id: targetRecipientId,
              actor_id: senderId,
              type: 'message',
              reference_id: isValidUUID(conversationId) ? conversationId : null,
              content: notifContent,
              is_read: false
            });
          } catch (ne) {
            console.warn('Direct message notification insert note:', ne.message);
          }
        }

        // Dual-persist to messages table for backwards/forwards compatibility across all app views
        if (targetRecipientId && isValidUUID(senderId) && isValidUUID(targetRecipientId)) {
          try {
            await supabase.from('messages').insert({
              id: isValidUUID(msgId) ? msgId : undefined,
              sender_id: senderId,
              receiver_id: targetRecipientId,
              content: content,
              text: content,
              media_url: mediaUrl,
              audio_url: messageType === 'audio' ? mediaUrl : null,
              metadata: { ...metadata, mediaType, isAudio: messageType === 'audio', isVideo: messageType === 'video' },
              is_read: false,
              created_at: now
            });
          } catch (_) {}
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
   * Delete a single message for the current user only (soft-delete / hide)
   * The message remains visible to the other participant.
   */
  async deleteMessageForMe(messageId, userId) {
    if (!messageId || !userId || !isSupabaseConfigured()) return;
    try {
      // Try soft-delete via metadata flag
      const { error } = await supabase
        .from('direct_messages')
        .update({
          metadata: supabase.sql`jsonb_set(COALESCE(metadata, '{}'), '{deleted_for}', (COALESCE(metadata->>'deleted_for', '[]')::jsonb || '"${userId}"'::jsonb))`,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      // Fallback: if soft-delete metadata update fails, just delete the row for this user
      if (error) {
        console.warn('deleteMessageForMe soft-delete fallback:', error.message);
        // Hard delete from direct_messages only if sender
        await supabase
          .from('direct_messages')
          .delete()
          .eq('id', messageId)
          .eq('sender_id', userId);
      }
    } catch (e) {
      console.warn('deleteMessageForMe error:', e?.message || e);
    }
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
    window.dispatchEvent(new CustomEvent('update_conversation_local', { detail: { conversationId, unreadCount: 0 } }));

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
      window.dispatchEvent(new CustomEvent('update_conversation_local', { detail: { conversationId, unreadCount: 0 } }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  },

  /**
   * Delete / leave conversation for a user (persisted directly in Supabase DB and local caches)
   */
  async deleteConversation(conversationId, userId, partnerId = null) {
    if (!conversationId || !userId) return { success: false };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(conversationId));
    let effectivePartnerId = partnerId;
    if (!effectivePartnerId) {
      if (String(conversationId).startsWith('conv_')) {
        effectivePartnerId = String(conversationId).replace('conv_', '');
      } else if (String(conversationId).startsWith('chat_')) {
        effectivePartnerId = String(conversationId).replace('chat_', '');
      }
    }

    // 0. Update LocalStorage conversation cache immediately (0ms instant UI removal)
    try {
      const cacheKey = `stagelink_cached_conversations_${userId}`;
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        const updated = cached.filter(c => {
          if (String(c.id) === String(conversationId)) return false;
          const cPartnerId = c.partner?.id || c.participant?.id || c.partnerId;
          if (effectivePartnerId && cPartnerId && String(cPartnerId) === String(effectivePartnerId)) return false;
          return true;
        });
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      }

      // Also clean up chats cache
      const chatsCacheKey = `stagelink_chats_${userId}`;
      const cachedChatsStr = localStorage.getItem(chatsCacheKey);
      if (cachedChatsStr) {
        const cachedChats = JSON.parse(cachedChatsStr);
        const updatedChats = cachedChats.filter(c => {
          if (String(c.id) === String(conversationId)) return false;
          const cPartnerId = c.participant?.id || c.partner?.id || c.partnerId;
          if (effectivePartnerId && cPartnerId && String(cPartnerId) === String(effectivePartnerId)) return false;
          return true;
        });
        localStorage.setItem(chatsCacheKey, JSON.stringify(updatedChats));
      }

      // Clean up cached message threads
      localStorage.removeItem(`stagelink_cached_msgs_${conversationId}`);
      if (effectivePartnerId) {
        localStorage.removeItem(`stagelink_cached_msgs_conv_${effectivePartnerId}`);
        localStorage.removeItem(`stagelink_cached_msgs_chat_${effectivePartnerId}`);
        localStorage.removeItem(`chat_messages_${userId}_${effectivePartnerId}`);
        localStorage.removeItem(`chat_messages_${effectivePartnerId}_${userId}`);
      }
    } catch (_) {}

    // Dispatch UI refresh events immediately
    window.dispatchEvent(new CustomEvent('conversation_deleted', { detail: { conversationId, partnerId: effectivePartnerId } }));
    window.dispatchEvent(new CustomEvent('delete_chat_local', { detail: { conversationId, partnerId: effectivePartnerId } }));
    window.dispatchEvent(new CustomEvent('refresh_conversations'));

    if (!isSupabaseConfigured()) return { success: true };

    try {
      // 1. If effectivePartnerId is not known and conversationId is UUID, look up partner from DB
      if (!effectivePartnerId && isUUID) {
        try {
          const { data: parts } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', userId)
            .limit(1);
          if (parts && parts.length > 0) {
            effectivePartnerId = parts[0].user_id;
          }
        } catch (_) {}
      }

      // 2. Try RPC delete_user_conversation if available
      if (isUUID) {
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('delete_user_conversation', {
            p_conversation_id: conversationId,
            p_user_id: userId
          });
          if (!rpcErr && rpcRes?.success) {
            return { success: true };
          }
        } catch (_) {}
      }

      // 3. Persist deletion in `chat_states` table in Supabase
      if (effectivePartnerId) {
        try {
          await supabase
            .from('chat_states')
            .upsert({
              user_id: userId,
              partner_id: effectivePartnerId,
              is_deleted: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,partner_id' });
        } catch (csErr) {
          console.warn('Persist chat_states deletion note:', csErr?.message || csErr);
        }
      }

      // 4. Update/Delete in conversation_participants & direct_messages & conversations
      if (isUUID) {
        try {
          await supabase
            .from('conversation_participants')
            .update({ left_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
        } catch (_) {}

        try {
          await supabase
            .from('conversation_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
        } catch (_) {}

        try {
          await supabase
            .from('direct_messages')
            .delete()
            .eq('conversation_id', conversationId);
        } catch (_) {}

        try {
          const { data: remainingParts } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .is('left_at', null);

          if (!remainingParts || remainingParts.length === 0) {
            await supabase.from('conversation_participants').delete().eq('conversation_id', conversationId);
            await supabase.from('conversations').delete().eq('id', conversationId);
          }
        } catch (_) {}
      }

      // 5. Delete in messages table (legacy/hybrid tables)
      if (effectivePartnerId) {
        try {
          await supabase
            .from('messages')
            .delete()
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${effectivePartnerId}),and(sender_id.eq.${effectivePartnerId},receiver_id.eq.${userId})`);
        } catch (_) {}

        try {
          await supabase
            .from('direct_messages')
            .delete()
            .or(`and(sender_id.eq.${userId},recipient_id.eq.${effectivePartnerId}),and(sender_id.eq.${effectivePartnerId},recipient_id.eq.${userId})`);
        } catch (_) {}
      }

      // 6. Clean up notifications for this conversation & partner
      try {
        if (isUUID) {
          await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .eq('reference_id', conversationId);
        }
        if (effectivePartnerId) {
          await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .eq('actor_id', effectivePartnerId)
            .eq('type', 'message');
        }
      } catch (_) {}

      // 7. Broadcast deletion in realtime
      try {
        if (isUUID) {
          supabase.channel(`dm:${conversationId}`).send({
            type: 'broadcast',
            event: 'conversation_deleted',
            payload: { conversationId, userId }
          }).catch(() => {});
        }
        if (effectivePartnerId) {
          supabase.channel(`user:${effectivePartnerId}`).send({
            type: 'broadcast',
            event: 'conversation_deleted',
            payload: { conversationId, userId, partnerId: effectivePartnerId }
          }).catch(() => {});
        }
      } catch (_) {}

      return { success: true };
    } catch (err) {
      console.warn('Delete conversation note:', err?.message || err);
      return { success: false, error: err?.message };
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
