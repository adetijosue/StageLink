import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured() {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('votre-projet') &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes('votre-cle')
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign up a new user with Supabase Auth & insert into public.profiles
 */
export async function signUpUser({ email, password, name, role }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role
        }
      }
    });

    if (authError) throw authError;

    if (authData?.user) {
      const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: username,
        full_name: name,
        avatar_url: '',
        bio: `Membre ${role} sur StageLink`,
        is_premium: false,
        verified_badge: 'none',
        skills: [role],
        instruments: [],
        genres: []
      });

      if (profileError) console.warn('Profile creation note:', profileError);

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          role: role,
          avatar: '',
          verified: false,
          badgeType: 'none',
          company: ''
        }
      };
    }

    throw new Error('Impossible de créer le compte.');
  } catch (err) {
    console.error('Supabase Auth Error:', err.message);
    return {
      success: false,
      error: err.message || 'Erreur lors de l’inscription.'
    };
  }
}

/**
 * Sign in an existing user with Supabase Auth
 */
export async function signInUser({ email, password }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    // Fetch profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.full_name || authData.user.user_metadata?.full_name || 'Artiste StageLink',
        role: profile?.role || profile?.skills?.[0] || 'Artiste',
        avatar: profile?.avatar_url || '',
        verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue',
        badgeType: profile?.verified_badge || 'none',
        company: profile?.company || ''
      }
    };
  } catch (err) {
    console.error('Supabase Auth Error:', err.message);
    return {
      success: false,
      error: err.message || 'Identifiants invalides.'
    };
  }
}

/**
 * Sign out the current user session
 */
export async function signOutUser() {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe to Realtime Messages Channel
 */
export function subscribeToRealtimeMessages(callback) {
  return supabase
    .channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => callback(payload.new)
    )
    .subscribe();
}
