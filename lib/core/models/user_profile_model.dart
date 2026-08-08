import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_profile_model.freezed.dart';
part 'user_profile_model.g.dart';

@freezed
class UserProfileModel with _$UserProfileModel {
  const factory UserProfileModel({
    required String id,
    required String username,
    @JsonKey(name: 'full_name') required String fullName,
    @JsonKey(name: 'avatar_url') String? avatarUrl,
    String? bio,
    @JsonKey(name: 'is_premium') @Default(false) bool isPremium,
    @JsonKey(name: 'verified_badge') @Default('none') String verifiedBadge,
    @Default([]) List<String> skills,
    @Default([]) List<String> instruments,
    @Default([]) List<String> genres,
    @JsonKey(name: 'created_at') DateTime? createdAt,
  }) = _UserProfileModel;

  factory UserProfileModel.fromJson(Map<String, dynamic> json) =>
      _$UserProfileModelFromJson(json);
}
