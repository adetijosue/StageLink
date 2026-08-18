/**
 * Offline Mutation Queue Service for StageLink
 * Buffers offline user interactions (likes, comments, follows, messages)
 * and automatically drains & syncs them to Supabase when network is restored.
 */

const OFFLINE_QUEUE_KEY = 'stagelink_offline_queue';

class OfflineQueueService {
  constructor() {
    this.isSyncing = false;
  }

  getQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  saveQueue(queue) {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to save offline queue:', e.message);
    }
  }

  enqueue(action) {
    if (!action || !action.type) return;
    const queue = this.getQueue();
    const item = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...action,
      createdAt: Date.now()
    };
    queue.push(item);
    this.saveQueue(queue);
    window.dispatchEvent(new CustomEvent('offline_queue_changed', { detail: { count: queue.length } }));
  }

  getPendingCount() {
    return this.getQueue().length;
  }

  async processQueue(supabaseClient) {
    if (this.isSyncing || !supabaseClient || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    const remaining = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        switch (item.type) {
          case 'LIKE_POST': {
            if (item.isLiked) {
              await supabaseClient.from('post_likes').upsert({
                post_id: item.postId,
                user_id: item.userId
              }, { onConflict: 'post_id,user_id' });
            } else {
              await supabaseClient.from('post_likes').delete()
                .eq('post_id', item.postId)
                .eq('user_id', item.userId);
            }
            syncedCount++;
            break;
          }

          case 'ADD_COMMENT': {
            await supabaseClient.from('post_comments').insert({
              post_id: item.postId,
              user_id: item.userId,
              content: item.content
            });
            syncedCount++;
            break;
          }

          case 'FOLLOW_USER': {
            await supabaseClient.from('followers').insert({
              follower_id: item.currentUserId,
              following_id: item.targetUserId
            });
            await supabaseClient.from('notifications').insert({
              user_id: item.targetUserId,
              actor_id: item.currentUserId,
              type: 'follow',
              reference_id: item.currentUserId
            });
            syncedCount++;
            break;
          }

          case 'SEND_MESSAGE': {
            await supabaseClient.from('direct_messages').insert({
              conversation_id: item.conversationId,
              sender_id: item.senderId,
              receiver_id: item.receiverId,
              content: item.content,
              media_url: item.mediaUrl || null,
              message_type: item.messageType || 'text'
            });
            syncedCount++;
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.warn('Failed to sync offline item, will retry later:', item, err?.message);
        remaining.push(item);
      }
    }

    this.saveQueue(remaining);
    this.isSyncing = false;

    if (syncedCount > 0) {
      window.dispatchEvent(new CustomEvent('offline_queue_synced', { detail: { syncedCount, remainingCount: remaining.length } }));
    }
  }
}

export const offlineQueue = new OfflineQueueService();
