import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = rawUrl.trim().replace(/\/+$/, '');
export const supabaseAnonKey = rawKey.trim();

export function isSupabaseConfigured() {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('votre-projet') &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes('votre-cle') &&
    supabaseUrl.startsWith('http')
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to retry async Supabase calls on network errors (e.g. flaky connections)
 */
async function withRetry(operation, maxRetries = 3, delayMs = 1000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await operation();
      // If there's an error from Supabase that looks like a network error, throw it to trigger retry
      if (result?.error) {
        const msg = result.error.message || '';
        if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network error')) {
          throw new Error('Network error detected');
        }
      }
      return result;
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network error') || msg.includes('Network error detected')) {
        attempt++;
        if (attempt >= maxRetries) {
          return { error: new Error('La connexion au serveur a échoué après plusieurs tentatives.') };
        }
        await new Promise(res => setTimeout(res, delayMs * attempt));
      } else {
        return { error: err };
      }
    }
  }
}

/**
 * Sign up a new user with Supabase Auth & insert into public.profiles
 */
export async function signUpUser({ email, password, name, role, gender = 'male' }) {
  try {
    const { data: authData, error: authError } = await withRetry(() => supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
          gender: gender
        }
      }
    }));

    if (authError) {
      let rawMsg = authError.message || (typeof authError === 'string' ? authError : '');
      if (rawMsg.includes('La connexion au serveur a échoué') || rawMsg.includes('Load failed') || rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
        rawMsg = 'Erreur de connexion au serveur. Le réseau est instable ou bloqué par un pare-feu.';
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
      
      // Upsert profile with full user metadata in public.profiles
      try {
        const { error: upsertErr } = await supabase.from('profiles').upsert({
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
          gear: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (upsertErr) {
          console.warn('Profile upsert note during signup:', upsertErr.message);
        }
      } catch (pe) {
        console.warn('Profile setup exception:', pe?.message || pe);
      }

      // If session not established, attempt auto-login
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
        } catch (le) {}
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
    const { data: authData, error: authError } = await withRetry(() => supabase.auth.signInWithPassword({
      email,
      password
    }));

    if (authError) {
      let rawMsg = authError.message || (typeof authError === 'string' ? authError : '');
      if (rawMsg.includes('La connexion au serveur a échoué') || rawMsg.includes('Load failed') || rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
        rawMsg = 'Erreur de connexion au serveur. Le réseau est instable ou bloqué par un pare-feu.';
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

      // If profile is missing in public.profiles table, create it immediately
      if (!profile && authData.user) {
        const userMeta = authData.user.user_metadata || {};
        const fallbackName = userMeta.full_name || userMeta.name || email.split('@')[0];
        const fallbackUsername = userMeta.username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.floor(Date.now() % 10000);
        const fallbackRole = userMeta.role || 'Artiste / Compositeur';

        const { data: createdProfile } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          username: fallbackUsername,
          full_name: fallbackName,
          email: email,
          role: fallbackRole,
          gender: userMeta.gender || 'male',
          avatar_url: '',
          bio: `Membre ${fallbackRole} sur StageLink`,
          verified_badge: 'none',
          instruments: [],
          genres: [],
          gear: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' }).select().maybeSingle();

        profile = createdProfile;
      }
    } catch (pe) {
      console.warn('Profile fetch notice:', pe?.message || pe);
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.full_name || authData.user.user_metadata?.full_name || email.split('@')[0],
        userName: profile?.username || authData.user.user_metadata?.username || (profile?.full_name ? profile.full_name.toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'artiste'),
        role: profile?.role || authData.user.user_metadata?.role || 'Artiste / Compositeur',
        gender: profile?.gender || authData.user.user_metadata?.gender || 'male',
        avatar: profile?.avatar_url || '',
        coverPhoto: profile?.cover_url || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
        verified: profile?.verified_badge === 'gold' || profile?.verified_badge === 'blue',
        badgeType: profile?.verified_badge || 'none',
        company: profile?.company || '',
        instruments: Array.isArray(profile?.instruments) ? profile.instruments : [],
        genres: Array.isArray(profile?.genres) ? profile.genres : [],
        gear: Array.isArray(profile?.gear) ? profile.gear : [],
        spotifyUrl: profile?.spotify_url || '',
        instagramUrl: profile?.instagram_url || '',
        tiktokUrl: profile?.tiktok_url || '',
        youtubeUrl: profile?.youtube_url || ''
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

export const SUPABASE_STORAGE_KEYS = [
  'sb-access-token',
  'sb-refresh-token',
  'sb-auth-token',
  'sb-session',
  'supabase.auth.token',
  'stagelink_supabase_auth_token',
  'stagelink_current_user'
];

/**
 * Reset all realtime channels and listeners on the Supabase client
 */
export function resetSupabaseClient() {
  try {
    if (supabase && typeof supabase.removeAllChannels === 'function') {
      supabase.removeAllChannels();
    }
  } catch (e) {
    console.warn('resetSupabaseClient note:', e);
  }
}

/**
 * Clear all Supabase Auth session tokens & cached keys from storage
 */
export function clearSupabaseAuthStorage() {
  try {
    resetSupabaseClient();
    if (typeof localStorage !== 'undefined') {
      // 1. Remove explicit keys
      SUPABASE_STORAGE_KEYS.forEach(key => {
        try { localStorage.removeItem(key); } catch (_) {}
      });

      // 2. Remove all pattern-matched keys (sb-*-auth-token, stagelink_cached_*, etc.)
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k && (
            k.startsWith('sb-') ||
            k.startsWith('supabase.') ||
            k.startsWith('stagelink_cached_') ||
            k.includes('auth-token') ||
            k.includes('supabase')
          )
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });
    }

    if (typeof sessionStorage !== 'undefined') {
      try { sessionStorage.clear(); } catch (_) {}
    }
  } catch (e) {
    console.warn('clearSupabaseAuthStorage note:', e);
  }
}

/**
 * Sign out the user session globally across all devices
 */
export async function signOutUser(options = { scope: 'global' }) {
  try {
    await supabase.auth.signOut(options);
    clearSupabaseAuthStorage();
    return { success: true };
  } catch (err) {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    clearSupabaseAuthStorage();
    return { success: false, error: err.message };
  }
}

/**
 * Delete current user account and cascade data across Supabase & Auth
 */
export async function deleteCurrentUserAccount() {
  try {
    const { error: rpcErr } = await supabase.rpc('delete_user_account');
    if (!rpcErr) {
      await signOutUser({ scope: 'global' });
      return { success: true };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase.from('profiles').delete().eq('id', user.id);
    }
    await signOutUser({ scope: 'global' });
    return { success: true };
  } catch (err) {
    try {
      await signOutUser({ scope: 'global' });
    } catch (_) {}
    return { success: false, error: err?.message || 'Erreur lors de la suppression.' };
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

/**
 * Convert base64 DataURL to File object
 */
export function dataURLtoFile(dataurl, filename = 'media_upload') {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) {
    return null;
  }
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.includes('video/mp4') ? 'mp4' : mime.includes('video/webm') ? 'webm' : mime.includes('video/quicktime') ? 'mov' : mime.includes('video/3gpp') ? '3gp' : mime.includes('video/x-m4v') ? 'm4v' : mime.includes('audio') ? 'webm' : (mime.split('/')[1] || 'jpg');
    return new File([u8arr], `${filename}.${ext}`, { type: mime });
  } catch (e) {
    console.warn('dataURLtoFile conversion note:', e);
    return null;
  }
}

/**
 * Safe wrapper for Supabase storage upload that falls back to compressed Base64 Data URL if bucket/RLS fails
 */
export const safeUploadToStorage = async (bucketName, filePath, dataUrl) => {
  if (!dataUrl) return '';
  if (typeof dataUrl === 'string' && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://'))) {
    return dataUrl;
  }

  const isVideo = typeof dataUrl === 'string' && (dataUrl.startsWith('data:video') || dataUrl.includes('.mp4') || dataUrl.includes('.webm'));
  const isAudio = typeof dataUrl === 'string' && (dataUrl.startsWith('data:audio') || dataUrl.includes('.mp3') || dataUrl.includes('.wav') || dataUrl.includes('.ogg') || dataUrl.includes('.m4a'));

  let optimizedDataUrl = dataUrl;
  
  if (!isSupabaseConfigured()) {
    return optimizedDataUrl;
  }

  try {
    const file = dataURLtoFile(optimizedDataUrl);
    if (!file) return optimizedDataUrl;

    let uploadedSuccessfully = false;
    let targetBucket = isVideo ? 'posts' : (bucketName || 'chat_media');
    const { error: uploadError } = await supabase.storage.from(targetBucket).upload(filePath, file, {
      upsert: true,
      contentType: file.type
    });

    if (!uploadError) {
      uploadedSuccessfully = true;
    } else {
      console.warn(`Storage upload attempt failed (${targetBucket}):`, uploadError.message);
      if (!uploadError.message?.includes('Bucket not found')) {
        const fallbackBucket = targetBucket === 'chat_media' ? 'posts' : 'chat_media';
        const { error: retryError } = await supabase.storage.from(fallbackBucket).upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });
        if (!retryError) {
          uploadedSuccessfully = true;
          targetBucket = fallbackBucket;
        }
      }
    }

    if (uploadedSuccessfully) {
      const { data: publicUrlData } = supabase.storage.from(targetBucket).getPublicUrl(filePath);
      if (publicUrlData && publicUrlData.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }

    return optimizedDataUrl;
  } catch (e) {
    console.warn('Storage upload fallback note:', e?.message || e);
    return dataUrl;
  }
};

