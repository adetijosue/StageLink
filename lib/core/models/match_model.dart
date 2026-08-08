import 'package:freezed_annotation/freezed_annotation.dart';

part 'match_model.freezed.dart';
part 'match_model.g.dart';

@freezed
class MatchModel with _$MatchModel {
  const factory MatchModel({
    required String id,
    @JsonKey(name: 'candidate_id') required String candidateId,
    @JsonKey(name: 'target_id') required String targetId,
    @JsonKey(name: 'match_score') @Default(80) int matchScore,
    @Default('pending') String status, // 'pending', 'accepted', 'rejected'
    @JsonKey(name: 'created_at') required DateTime createdAt,
  }) = _MatchModel;

  factory MatchModel.fromJson(Map<String, dynamic> json) =>
      _$MatchModelFromJson(json);
}
