import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rtshwspmvbdopgmzvmzq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0c2h3c3BtdmJkb3BnbXp2bXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDQwMzAsImV4cCI6MjEwMDQyMDAzMH0.9YQXTX92kKgqT3xR89niZrNXY6Yh52m7QI3UOUAH9vU';

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

    if (authError) {
      let msg = authError.message;
      if (msg.includes('already registered')) msg = 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.';
      if (msg.includes('at least 6 characters')) msg = 'Le mot de passe doit contenir au moins 6 caractères.';
      if (msg.includes('invalid email')) msg = 'Adresse e-mail invalide.';
      throw new Error(msg);
    }

    if (authData?.user) {
      const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      
      // Upsert profile safely (onConflict: 'id') to avoid trigger duplicate key errors
      try {
        await supabase.from('profiles').upsert({
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
        }, { onConflict: 'id' });
      } catch (profileErr) {
        console.warn('Profile upsert note:', profileErr.message);
      }

      // If email confirmation is disabled or session acquired, user is ready
      let sessionUser = authData.user;
      if (!authData.session) {
        // Attempt immediate login to obtain session if unconfirmed mode allows
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
          email: sessionUser.email,
          name: name,
          role: role,
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

    throw new Error('Impossible de créer le compte.');
  } catch (err) {
    console.error('Supabase Auth Signup Error:', err.message);
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

    if (authError) {
      let msg = authError.message;
      if (msg.includes('Invalid login credentials')) msg = 'Adresse e-mail ou mot de passe incorrect.';
      if (msg.includes('Email not confirmed')) msg = 'Veuillez confirmer votre adresse e-mail pour vous connecter.';
      throw new Error(msg);
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
      console.warn('Profile fetch notice:', pe.message);
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.full_name || authData.user.user_metadata?.full_name || email.split('@')[0],
        role: profile?.role || profile?.skills?.[0] || authData.user.user_metadata?.role || 'Artiste / Compositeur',
        avatar: profile?.avatar_url || '',
        verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue',
        badgeType: profile?.verified_badge || 'none',
        company: profile?.company || '',
        instruments: profile?.instruments || [],
        genres: profile?.genres || [],
        gear: profile?.gear || []
      }
    };
  } catch (err) {
    console.error('Supabase Auth Signin Error:', err.message);
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
