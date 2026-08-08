import 'package:freezed_annotation/freezed_annotation.dart';

part 'post_model.freezed.dart';
part 'post_model.g.dart';

@freezed
class PostModel with _$PostModel {
  const factory PostModel({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    String? content,
    @JsonKey(name: 'media_url') String? mediaUrl,
    @JsonKey(name: 'audio_url') String? audioUrl,
    @JsonKey(name: 'likes_count') @Default(0) int likesCount,
    @JsonKey(name: 'created_at') required DateTime createdAt,
  }) = _PostModel;

  factory PostModel.fromJson(Map<String, dynamic> json) =>
      _$PostModelFromJson(json);
}
