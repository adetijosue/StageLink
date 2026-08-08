import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/message_model.dart';
import '../services/supabase_service.dart';

part 'messaging_repository.g.dart';

@riverpod
MessagingRepository messagingRepository(MessagingRepositoryRef ref) {
  final client = ref.watch(supabaseClientProvider);
  return MessagingRepository(client);
}

class MessagingRepository {
  final SupabaseClient _client;

  MessagingRepository(this._client);

  /// Listen to Realtime Message Stream for Receiver / Conversation
  Stream<List<MessageModel>> getMessagesStream(String currentUserId, String partnerId) {
    return _client
        .from('messages')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: true)
        .map((maps) => maps
            .where((m) =>
                (m['sender_id'] == currentUserId && m['receiver_id'] == partnerId) ||
                (m['sender_id'] == partnerId && m['receiver_id'] == currentUserId))
            .map((map) => MessageModel.fromJson(map))
            .toList());
  }

  /// Send Message (Text, Voice Note, or Image Attachment)
  Future<MessageModel> sendMessage({
    required String senderId,
    required String receiverId,
    String? content,
    File? mediaAttachment,
    File? voiceNote,
    bool isEphemeral = false,
    int? ttlSeconds,
  }) async {
    String? mediaUrl;
    String? audioNoteUrl;

    if (mediaAttachment != null) {
      final fileName = 'chat_img_${DateTime.now().millisecondsSinceEpoch}.jpg';
      await _client.storage.from('chat_attachments').upload(fileName, mediaAttachment);
      mediaUrl = _client.storage.from('chat_attachments').getPublicUrl(fileName);
    }

    if (voiceNote != null) {
      final fileName = 'chat_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _client.storage.from('chat_attachments').upload(fileName, voiceNote);
      audioNoteUrl = _client.storage.from('chat_attachments').getPublicUrl(fileName);
    }

    final data = await _client.from('messages').insert({
      'sender_id': senderId,
      'receiver_id': receiverId,
      'content': content,
      'media_url': mediaUrl,
      'audio_note_url': audioNoteUrl,
      'is_ephemeral': isEphemeral,
      'ttl_seconds': ttlSeconds,
    }).select().single();

    return MessageModel.fromJson(data);
  }
}
