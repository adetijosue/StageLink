-- ================================================================
--  StageLink — Script SQL Production Complet
--  À coller dans Supabase → SQL Editor → New Query → Run
-- ================================================================
--  ⚠️  Ce script est IDEMPOTENT : vous pouvez le relancer
--      sans risque grâce aux "IF NOT EXISTS" partout.
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ════════════════════════════════════════════════════════════════
-- 2. TABLE — PROFILES (profil utilisateur)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
    id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    full_name     TEXT NOT NULL,
    email         TEXT,
    avatar_url    TEXT,
    cover_url     TEXT,
    bio           TEXT DEFAULT '',
    role          TEXT DEFAULT 'Artiste',
    company       TEXT DEFAULT '',
    location      TEXT DEFAULT '',
    is_premium    BOOLEAN DEFAULT FALSE,
    verified_badge TEXT DEFAULT 'none',        -- 'none', 'blue', 'gold'
    skills        TEXT[] DEFAULT '{}',
    instruments   TEXT[] DEFAULT '{}',
    genres        TEXT[] DEFAULT '{}',
    gear          TEXT[] DEFAULT '{}',
    followers_count  INT DEFAULT 0,
    following_count  INT DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ════════════════════════════════════════════════════════════════
-- 3. TABLE — POSTS (publications du feed)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.posts (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content       TEXT,
    media_url     TEXT,
    audio_url     TEXT,
    audio_title   TEXT,
    likes_count   INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ════════════════════════════════════════════════════════════════
-- 4. TABLE — POST_LIKES (qui a liké quel post)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.post_likes (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id       UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(post_id, user_id)
);


-- ════════════════════════════════════════════════════════════════
-- 5. TABLE — POST_COMMENTS (commentaires des posts)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.post_comments (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id       UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content       TEXT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ════════════════════════════════════════════════════════════════
-- 6. TABLE — STORIES (stories éphémères 24h)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stories (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_url     TEXT NOT NULL,
    caption       TEXT DEFAULT '',
    is_video      BOOLEAN DEFAULT FALSE,
    expires_at    TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ════════════════════════════════════════════════════════════════
-- 7. TABLE — MATCHES (matching IA / candidatures)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.matches (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    match_score   INT DEFAULT 80,
    status        TEXT DEFAULT 'pending',     -- 'pending', 'accepted', 'rejected'
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(candidate_id, target_id)
);


-- ════════════════════════════════════════════════════════════════
-- 8. TABLE — MESSAGES (chat privé + messages éphémères)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.messages (
    id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content        TEXT,
    media_url      TEXT,
    audio_url      TEXT,
    audio_note_url TEXT,
    metadata       JSONB DEFAULT '{}'::jsonb,
    is_ephemeral   BOOLEAN DEFAULT FALSE,
    ttl_seconds    INT DEFAULT NULL,
    is_read        BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ════════════════════════════════════════════════════════════════
-- 9. TABLE — FOLLOWERS (abonnements entre utilisateurs)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.followers (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(follower_id, following_id)
);


-- ════════════════════════════════════════════════════════════════
-- 9b. TABLE — CHAT_STATES (états et paramètres des conversations)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chat_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    force_unread BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, partner_id)
);


-- ════════════════════════════════════════════════════════════════
-- 10. FONCTION — Création automatique du profil à l'inscription
--     (se déclenche quand un nouvel utilisateur s'inscrit via Auth)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(SPLIT_PART(NEW.email, '@', 1), 'user') || '_' || FLOOR(RANDOM() * 10000)::TEXT,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        '',
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'Artiste')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : exécuter la fonction après chaque nouvelle inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════════
-- 11. INDEXES DE PERFORMANCE
-- ════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_posts_user_id       ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at    ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post     ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user     ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post  ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id     ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires     ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender     ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver   ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created    ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_candidate   ON public.matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_matches_target      ON public.matches(target_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower  ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_id);


-- ════════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY (RLS) — Sécurité par ligne
-- ════════════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_states   ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Tout le monde peut voir les profils"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent creer leur propre profil"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur profil"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── POSTS ──
CREATE POLICY "Les posts sont visibles par tous les authentifies"
    ON public.posts FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent publier"
    ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs posts"
    ON public.posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs posts"
    ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- ── POST LIKES ──
CREATE POLICY "Les likes sont visibles par tous les authentifies"
    ON public.post_likes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent liker"
    ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent retirer leur like"
    ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- ── POST COMMENTS ──
CREATE POLICY "Les commentaires sont visibles par tous les authentifies"
    ON public.post_comments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent commenter"
    ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs commentaires"
    ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- ── STORIES ──
CREATE POLICY "Les stories non expirees sont visibles"
    ON public.stories FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Les utilisateurs peuvent publier des stories"
    ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs stories"
    ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- ── MATCHES ──
CREATE POLICY "Les utilisateurs voient leurs propres matches"
    ON public.matches FOR SELECT USING (auth.uid() = candidate_id OR auth.uid() = target_id);

CREATE POLICY "Les utilisateurs peuvent creer des matches"
    ON public.matches FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Les utilisateurs peuvent repondre aux matches"
    ON public.matches FOR UPDATE USING (auth.uid() = candidate_id OR auth.uid() = target_id);

-- ── MESSAGES ──
CREATE POLICY "Les utilisateurs voient leurs conversations"
    ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
    ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ── CHAT_STATES ──
CREATE POLICY "Les utilisateurs gèrent leurs états"
    ON public.chat_states FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs messages"
    ON public.messages FOR DELETE USING (auth.uid() = sender_id);

CREATE POLICY "Les destinataires peuvent marquer comme lu"
    ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- ── FOLLOWERS ──
CREATE POLICY "Les abonnements sont visibles par tous les authentifies"
    ON public.followers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent suivre"
    ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Les utilisateurs peuvent se desabonner"
    ON public.followers FOR DELETE USING (auth.uid() = follower_id);


-- ════════════════════════════════════════════════════════════════
-- 13. TABLE — NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,
    reference_id  UUID,
    is_read       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs propres notifications" 
    ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent marquer comme lu"
    ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tout le monde peut inserer des notifications"
    ON public.notifications FOR INSERT WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════-- 14. REALTIME — Activer les notifications en temps réel
-- ════════════════════════════════════════════════════════════════
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_states;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;


-- ════════════════════════════════════════════════════════════════
-- 14. NETTOYAGE AUTOMATIQUE — Supprimer les stories expirées
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    DELETE FROM public.stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pour activer le nettoyage automatique, allez dans Supabase :
--   Dashboard > Database > Extensions > pg_cron (activer)
-- Puis exécutez :
--   SELECT cron.schedule('cleanup-stories', '0 * * * *', 'SELECT public.cleanup_expired_stories()');
-- Cela supprimera les stories expirees toutes les heures.


-- ════════════════════════════════════════════════════════════════
-- 15. STORAGE BUCKETS (a creer manuellement dans Dashboard)
-- ════════════════════════════════════════════════════════════════
-- Les buckets ne peuvent pas etre crees via SQL standard.
-- Creez-les dans Supabase Dashboard > Storage > New Bucket :
--
--   avatars          > Public
--   posts-media      > Public
--   stories-media    > Public
--   chat-attachments > Private
--
-- Pour chaque bucket PUBLIC, ajoutez cette policy dans Storage :
--   Policy name : "Acces public en lecture"
--   Allowed operation : SELECT
--   Policy : true
--
--   Policy name : "Upload authentifie"
--   Allowed operation : INSERT
--   Policy : auth.role() = 'authenticated'


-- ════════════════════════════════════════════════════════════════
--  SCRIPT TERMINE — Votre base StageLink est prete !
-- ════════════════════════════════════════════════════════════════
