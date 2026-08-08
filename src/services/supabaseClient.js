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
 * Get the current Supabase session (for restoring auth state on app startup)
 */
export async function getSupabaseSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase getSession error:', error.message);
      return null;
    }
    return session;
  } catch (err) {
    console.warn('Supabase getSession exception:', err.message);
    return null;
  }
}

/**
 * Subscribe to Supabase auth state changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Sign up a new user with Supabase Auth & insert into public.profiles
 * 
 * IMPORTANT: Only uses columns that EXIST in the production schema:
 * id, username, full_name, email, avatar_url, bio, role, gender, verified_badge,
 * location, company, instruments, genres, gear
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
      
      console.error('[StageLink] Supabase Auth signUp error:', rawMsg, authError);

      // Translate known error messages to French
      if (rawMsg.includes('already registered') || rawMsg.includes('User already exists')) {
        rawMsg = 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.';
      } else if (rawMsg.includes('at least 6 characters') || rawMsg.includes('Password should be')) {
        rawMsg = 'Le mot de passe doit contenir au moins 6 caractères.';
      } else if (rawMsg.includes('invalid email') || rawMsg.includes('Unable to validate email')) {
        rawMsg = 'Adresse e-mail invalide.';
      } else if (authError.name === 'AuthRetryableFetchError' || !rawMsg || rawMsg === '{}') {
        rawMsg = 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.';
      }

      return { success: false, error: rawMsg };
    }

    if (authData?.user) {
      const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      
      // Upsert profile with ONLY valid production schema columns
      // The handle_new_user() trigger should already create the profile,
      // but we upsert to ensure the data is complete
      try {
        const { error: pErr } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          username: username,
          full_name: name,
          email: email,
          avatar_url: '',
          bio: `Membre ${role} sur StageLink`,
          role: role,
          gender: gender,
          verified_badge: 'none'
        }, { onConflict: 'id' });

        if (pErr) {
          console.warn('[StageLink] Profile upsert warning:', pErr.message, pErr.code);
        }
      } catch (profileErr) {
        console.warn('[StageLink] Profile upsert exception:', profileErr?.message || profileErr);
      }

      // If email confirmation is disabled, session is immediately available
      // If enabled, try to sign in to get a session
      let sessionUser = authData.user;
      if (!authData.session) {
        try {
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (loginData?.user) {
            sessionUser = loginData.user;
          }
        } catch (loginErr) {
          console.warn('[StageLink] Auto-login after signup failed:', loginErr?.message);
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

    // No authData.user and no error — should not happen, but handle gracefully
    console.error('[StageLink] signUp returned no user and no error');
    return {
      success: false,
      error: 'Erreur inattendue lors de la création du compte. Veuillez réessayer.'
    };
  } catch (err) {
    console.error('[StageLink] Supabase Auth Signup Exception:', err);
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
      console.error('[StageLink] Supabase Auth signIn error:', rawMsg);

      if (!rawMsg || rawMsg === '{}' || rawMsg.includes('{')) {
        rawMsg = 'Adresse e-mail ou mot de passe incorrect.';
      }
      if (rawMsg.includes('Invalid login credentials')) {
        rawMsg = 'Adresse e-mail ou mot de passe incorrect.';
      } else if (rawMsg.includes('Email not confirmed')) {
        rawMsg = 'Veuillez confirmer votre adresse e-mail pour vous connecter.';
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
      console.warn('[StageLink] Profile fetch notice:', pe?.message || pe);
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.full_name || authData.user.user_metadata?.full_name || email.split('@')[0],
        role: profile?.role || authData.user.user_metadata?.role || 'Artiste / Compositeur',
        gender: profile?.gender || authData.user.user_metadata?.gender || 'male',
        avatar: profile?.avatar_url || '',
        verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue',
        badgeType: profile?.verified_badge || 'none',
        company: profile?.company || '',
        instruments: profile?.instruments || [],
        genres: profile?.genres || [],
        gear: profile?.gear || [],
        bio: profile?.bio || '',
        location: profile?.location || ''
      }
    };
  } catch (err) {
    console.error('[StageLink] Supabase Auth Signin Exception:', err);
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
 * Fetch a user profile from Supabase by ID
 */
export async function fetchProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[StageLink] fetchProfile error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[StageLink] fetchProfile exception:', err.message);
    return null;
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
