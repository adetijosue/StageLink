import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/post_model.dart';
import '../services/supabase_service.dart';

part 'feed_repository.g.dart';

@riverpod
FeedRepository feedRepository(FeedRepositoryRef ref) {
  final client = ref.watch(supabaseClientProvider);
  return FeedRepository(client);
}

class FeedRepository {
  final SupabaseClient _client;

  FeedRepository(this._client);

  /// Fetch Paginated Posts
  Future<List<PostModel>> fetchPosts({int offset = 0, int limit = 20}) async {
    final response = await _client
        .from('posts')
        .select()
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);

    return (response as List).map((json) => PostModel.fromJson(json)).toList();
  }

  /// Create New Post & Upload Media to Storage Bucket
  Future<PostModel> createPost({
    required String userId,
    String? content,
    File? mediaFile,
    File? audioFile,
  }) async {
    String? mediaUrl;
    String? audioUrl;

    if (mediaFile != null) {
      final fileName = 'post_${DateTime.now().millisecondsSinceEpoch}.jpg';
      await _client.storage.from('posts_media').upload(fileName, mediaFile);
      mediaUrl = _client.storage.from('posts_media').getPublicUrl(fileName);
    }

    if (audioFile != null) {
      final fileName = 'audio_${DateTime.now().millisecondsSinceEpoch}.mp3';
      await _client.storage.from('posts_media').upload(fileName, audioFile);
      audioUrl = _client.storage.from('posts_media').getPublicUrl(fileName);
    }

    final data = await _client.from('posts').insert({
      'user_id': userId,
      'content': content,
      'media_url': mediaUrl,
      'audio_url': audioUrl,
      'likes_count': 0,
    }).select().single();

    return PostModel.fromJson(data);
  }
}
