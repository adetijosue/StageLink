import 'package:freezed_annotation/freezed_annotation.dart';

part 'story_model.freezed.dart';
part 'story_model.g.dart';

@freezed
class StoryModel with _$StoryModel {
  const factory StoryModel({
    required String id,
    @JsonKey(name: 'user_id') required String userId,
    @JsonKey(name: 'media_url') required String mediaUrl,
    @JsonKey(name: 'is_video') @Default(false) bool isVideo,
    @JsonKey(name: 'expires_at') required DateTime expiresAt,
    @JsonKey(name: 'created_at') required DateTime createdAt,
  }) = _StoryModel;

  factory StoryModel.fromJson(Map<String, dynamic> json) =>
      _$StoryModelFromJson(json);
}
