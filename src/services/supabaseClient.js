import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shklbnxxpcioavsplbem.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoa2xibnh4cGNpb2F2c3BsYmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTQzODcsImV4cCI6MjEwMTc3MDM4N30.xG1YWOQAX4jiD3M66OFRByK5R85-a2MaAIAxKPca4RM';

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
export async function signUpUser({ email, password, name, role, gender = 'male' }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
          gender: gender
        }
      }
    });

    if (authError) {
      let rawMsg = authError.message || (typeof authError === 'string' ? authError : '');
      if (rawMsg.includes('Load failed') || rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
        rawMsg = 'Erreur de connexion au serveur. Veuillez vérifier votre connexion Internet et réessayer.';
      } else if (rawMsg.includes('already registered') || rawMsg.includes('User already exists') || rawMsg.includes('user_already_exists')) {
        rawMsg = 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.';
      } else if (rawMsg.includes('at least 6 characters') || rawMsg.includes('Password should be')) {
        rawMsg = 'Le mot de passe doit contenir au moins 6 caractères.';
      } else if (rawMsg.includes('invalid email') || rawMsg.includes('Unable to validate email')) {
        rawMsg = 'Adresse e-mail invalide.';
      } else if (rawMsg.includes('rate limit') || rawMsg.includes('rate_limit')) {
        rawMsg = 'Trop de tentatives en peu de temps. Veuillez patienter une minute avant de réessayer.';
      } else if (!rawMsg || rawMsg === '{}' || rawMsg.includes('{')) {
        rawMsg = 'Erreur lors de la création du compte dans Supabase. Veuillez réessayer.';
      }
      return { success: false, error: rawMsg };
    }

    if (authData?.user) {
      // Check if user already exists (Supabase returns empty identities array for existing users when email confirmation is enabled)
      if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        return {
          success: false,
          error: 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.'
        };
      }

      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.floor(Date.now() % 10000);
      
      // Upsert profile safely using exact matching DB columns
      try {
        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          username: username,
          full_name: name,
          email: email,
          role: role,
          gender: gender,
          avatar_url: '',
          bio: `Membre ${role} sur StageLink`,
          verified_badge: 'none',
          instruments: [],
          genres: [],
          gear: []
        }, { onConflict: 'id' });

        if (profileErr) {
          console.warn('Profile upsert note:', profileErr.message);
        }
      } catch (pe) {
        console.warn('Profile upsert exception:', pe?.message || pe);
      }

      // If session not established, attempt auto-login
      let sessionUser = authData.user;
      if (!authData.session) {
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (loginData?.user) {
          sessionUser = loginData.user;
        }
      }

      return {
        success: true,
        user: {
          id: sessionUser.id,
          email: sessionUser.email || email,
          name: name,
          role: role,
          gender: gender,
          avatar: '',
          verified: false,
          badgeType: 'none',
          company: '',
          instruments: [],
          genres: [],
          gear: []
        }
      };
    }

    return {
      success: false,
      error: 'Impossible d\'inscrire l\'utilisateur. Veuillez réessayer.'
    };
  } catch (err) {
    console.error('Supabase Auth Signup Error:', err);
    let errMsg = err?.message || (typeof err === 'string' ? err : '');
    if (!errMsg || errMsg === '{}' || errMsg.includes('{')) {
      errMsg = 'Erreur lors de la création du compte. Veuillez réessayer.';
    }
    return {
      success: false,
      error: errMsg
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

    if (authError) {
      let rawMsg = authError.message || (typeof authError === 'string' ? authError : '');
      if (rawMsg.includes('Load failed') || rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
        rawMsg = 'Erreur de connexion au serveur. Veuillez vérifier votre connexion Internet et réessayer.';
      } else if (rawMsg.includes('Invalid login credentials')) {
        rawMsg = 'Adresse e-mail ou mot de passe incorrect.';
      } else if (rawMsg.includes('Email not confirmed')) {
        rawMsg = 'Veuillez confirmer votre adresse e-mail pour vous connecter.';
      } else if (!rawMsg || rawMsg === '{}' || rawMsg.includes('{')) {
        rawMsg = 'Adresse e-mail ou mot de passe incorrect.';
      }
      return { success: false, error: rawMsg };
    }

    // Fetch profile details with maybeSingle() to avoid single() row missing exception
    let profile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      profile = data;
    } catch (pe) {
      console.warn('Profile fetch notice:', pe?.message || pe);
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.full_name || authData.user.user_metadata?.full_name || email.split('@')[0],
        role: profile?.role || authData.user.user_metadata?.role || 'Artiste / Compositeur',
        avatar: profile?.avatar_url || '',
        coverPhoto: profile?.cover_url || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
        verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue',
        badgeType: profile?.verified_badge || 'none',
        company: profile?.company || '',
        instruments: profile?.instruments || [],
        genres: profile?.genres || [],
        gear: profile?.gear || []
      }
    };
  } catch (err) {
    console.error('Supabase Auth Signin Error:', err);
    let errMsg = err?.message || (typeof err === 'string' ? err : '');
    if (typeof errMsg !== 'string' || !errMsg.trim()) {
      errMsg = 'Erreur lors de la connexion. Veuillez réessayer.';
    }
    return {
      success: false,
      error: errMsg
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
