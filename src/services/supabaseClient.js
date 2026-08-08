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
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const cleanName = name.trim();

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: cleanName,
          role: role,
          gender: gender
        }
      }
    });

    if (authError) {
      let rawMsg = authError.message || (typeof authError === 'string' ? authError : '');
      console.warn('[StageLink] Supabase Auth signUp note:', rawMsg, authError);

      // If user already exists, seamlessly attempt login
      if (rawMsg.includes('already registered') || rawMsg.includes('User already exists') || authError.status === 422) {
        console.log('[StageLink] Account exists, attempting auto-login...');
        const loginRes = await signInUser({ email: cleanEmail, password: cleanPassword });
        if (loginRes.success) {
          return loginRes;
        }
        return { success: false, error: 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.' };
      }

      // If SDK fetch failed (e.g. AuthRetryableFetchError), fallback to direct REST fetch
      if (authError.name === 'AuthRetryableFetchError' || !rawMsg || rawMsg === '{}') {
        try {
          console.log('[StageLink] Retrying signup via direct REST fetch fallback...');
          const restRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: cleanEmail,
              password: cleanPassword,
              data: { full_name: cleanName, role, gender }
            })
          });

          if (restRes.ok) {
            const restData = await restRes.json();
            if (restData?.user) {
              const userId = restData.user.id;
              // Save session token if returned
              if (restData.access_token) {
                try {
                  await supabase.auth.setSession({
                    access_token: restData.access_token,
                    refresh_token: restData.refresh_token
                  });
                } catch (se) {}
              }

              // Upsert profile
              try {
                await supabase.from('profiles').upsert({
                  id: userId,
                  username: cleanEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000),
                  full_name: cleanName,
                  email: cleanEmail,
                  avatar_url: '',
                  bio: `Membre ${role} sur StageLink`,
                  role: role,
                  gender: gender,
                  verified_badge: 'none'
                }, { onConflict: 'id' });
              } catch (pe) {}

              return {
                success: true,
                user: {
                  id: userId,
                  email: cleanEmail,
                  name: cleanName,
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
          }
        } catch (fetchErr) {
          console.error('[StageLink] Direct REST signup fetch error:', fetchErr);
        }

        // Try login fallback as last resort
        const fallbackLogin = await signInUser({ email: cleanEmail, password: cleanPassword });
        if (fallbackLogin.success) return fallbackLogin;

        return { success: false, error: 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.' };
      }

      // Translate known validation error messages
      if (rawMsg.includes('at least 6 characters') || rawMsg.includes('Password should be')) {
        rawMsg = 'Le mot de passe doit contenir au moins 6 caractères.';
      } else if (rawMsg.includes('invalid email') || rawMsg.includes('Unable to validate email')) {
        rawMsg = 'Adresse e-mail invalide.';
      }

      return { success: false, error: rawMsg };
    }

    if (authData?.user) {
      const username = cleanEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      const userId = authData.user.id;
      
      // Upsert profile
      try {
        const { error: pErr } = await supabase.from('profiles').upsert({
          id: userId,
          username: username,
          full_name: cleanName,
          email: cleanEmail,
          avatar_url: '',
          bio: `Membre ${role} sur StageLink`,
          role: role,
          gender: gender,
          verified_badge: 'none'
        }, { onConflict: 'id' });

        if (pErr) {
          console.warn('[StageLink] Profile upsert warning:', pErr.message);
        }
      } catch (profileErr) {
        console.warn('[StageLink] Profile upsert exception:', profileErr?.message || profileErr);
      }

      // Guarantee session acquisition
      let sessionUser = authData.user;
      if (!authData.session) {
        try {
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
          });
          if (loginData?.user) {
            sessionUser = loginData.user;
          }
        } catch (loginErr) {
          console.warn('[StageLink] Auto-login notice:', loginErr?.message);
        }
      }

      return {
        success: true,
        user: {
          id: sessionUser.id,
          email: sessionUser.email || cleanEmail,
          name: cleanName,
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
      error: 'Erreur inattendue lors de la création du compte. Veuillez réessayer.'
    };
  } catch (err) {
    console.error('[StageLink] Supabase Auth Signup Exception:', err);
    // Try auto-login if account exists
    const fallbackLogin = await signInUser({ email: cleanEmail, password: cleanPassword });
    if (fallbackLogin.success) return fallbackLogin;

    return {
      success: false,
      error: 'Erreur lors de la création du compte. Veuillez réessayer.'
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
