import 'package:freezed_annotation/freezed_annotation.dart';

part 'message_model.freezed.dart';
part 'message_model.g.dart';

@freezed
class MessageModel with _$MessageModel {
  const factory MessageModel({
    required String id,
    @JsonKey(name: 'sender_id') required String senderId,
    @JsonKey(name: 'receiver_id') required String receiverId,
    String? content,
    @JsonKey(name: 'media_url') String? mediaUrl,
    @JsonKey(name: 'audio_note_url') String? audioNoteUrl,
    @JsonKey(name: 'is_ephemeral') @Default(false) bool isEphemeral,
    @JsonKey(name: 'ttl_seconds') int? ttlSeconds,
    @JsonKey(name: 'created_at') required DateTime createdAt,
  }) = _MessageModel;

  factory MessageModel.fromJson(Map<String, dynamic> json) =>
      _$MessageModelFromJson(json);
}
