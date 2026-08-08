import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

part 'supabase_service.g.dart';

/// Global Supabase Client Riverpod Provider
@riverpod
SupabaseClient supabaseClient(SupabaseClientRef ref) {
  return Supabase.instance.client;
}

class SupabaseService {
  static Future<void> initialize() async {
    await dotenv.load(fileName: '.env');

    final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? 'https://rtshwspmvbdopgmzvmzq.supabase.co';
    final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
      realtimeClientOptions: const RealtimeClientOptions(
        logLevel: RealtimeLogLevel.info,
      ),
    );
  }

  /// Listens to authentication state changes (Signed In, Signed Out, Token Refreshed)
  static Stream<AuthState> get authStateStream =>
      Supabase.instance.client.auth.onAuthStateChange;

  /// Current logged-in user session
  static User? get currentUser => Supabase.instance.client.auth.currentUser;
}
