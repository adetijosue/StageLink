import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_profile_model.dart';
import '../services/supabase_service.dart';

part 'auth_repository.g.dart';

@riverpod
AuthRepository authRepository(AuthRepositoryRef ref) {
  final client = ref.watch(supabaseClientProvider);
  return AuthRepository(client);
}

class AuthRepository {
  final SupabaseClient _client;

  AuthRepository(this._client);

  /// SignUp with Email & Password
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    required String fullName,
    required String role,
  }) async {
    final res = await _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName,
        'role': role,
      },
    );

    if (res.user != null) {
      final username = '${email.split('@')[0]}_${DateTime.now().millisecondsSinceEpoch % 1000}';
      await _client.from('profiles').insert({
        'id': res.user!.id,
        'username': username,
        'full_name': fullName,
        'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        'bio': 'Membre $role sur StageLink',
        'is_premium': true,
        'verified_badge': 'gold',
        'skills': [role],
        'instruments': [],
        'genres': [],
      });
    }

    return res;
  }

  /// SignIn with Email & Password
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  /// Fetch User Profile by ID
  Future<UserProfileModel?> getProfile(String userId) async {
    final data = await _client
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();

    if (data == null) return null;
    return UserProfileModel.fromJson(data);
  }

  /// SignOut User Session
  Future<void> signOut() async {
    await _client.auth.signOut();
  }
}
