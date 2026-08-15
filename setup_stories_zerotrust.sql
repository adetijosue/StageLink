-- ==============================================================================
-- STAGELINK: ZERO-TRUST EPHEMERAL STORIES MIGRATION
-- ==============================================================================

-- 1. ENUMS (Safe Creation)
DO $$ BEGIN
    CREATE TYPE public.story_media_type AS ENUM ('image', 'video', 'text');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.story_privacy_type AS ENUM ('all_contacts', 'include_only', 'exclude');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ALTER STORIES TABLE (Add privacy settings)
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS privacy_type public.story_privacy_type DEFAULT 'all_contacts';

-- 3. AUDIENCE RULES TABLE (Whitelist/Blacklist)
CREATE TABLE IF NOT EXISTS public.story_audience_rules (
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, target_user_id)
);
CREATE INDEX IF NOT EXISTS idx_story_audience_target ON public.story_audience_rules(target_user_id);
ALTER TABLE public.story_audience_rules ENABLE ROW LEVEL SECURITY;

-- 4. CLEANUP CRON JOB (If pg_cron is enabled in Supabase)
-- Exécuter toutes les heures pour nettoyer les stories expirées
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup-expired-stories', '0 * * * *', $$
        DELETE FROM public.stories WHERE expires_at < NOW();
    $$);
  END IF;
END $$;

-- ==============================================================================
-- 5. ZERO-TRUST READ POLICY (STABLE SECURITY DEFINER)
-- ==============================================================================
-- ==============================================================================
-- 5. ZERO-TRUST READ POLICY (STABLE SECURITY DEFINER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.can_view_story(_story_id UUID, _viewer_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    _story RECORD;
    _is_contact BOOLEAN;
    _in_audience BOOLEAN;
BEGIN
    -- 1. Récupérer la story
    SELECT user_id, privacy_type, expires_at INTO _story FROM public.stories WHERE id = _story_id;
    
    -- 2. TTL (Expiration) validation
    IF NOT FOUND OR _story.expires_at < NOW() THEN RETURN FALSE; END IF;
    
    -- 3. Le créateur a toujours un accès total (ou si aucun viewer spécifié sur story publique)
    IF _viewer_id IS NOT NULL AND _story.user_id = _viewer_id THEN RETURN TRUE; END IF;

    -- 4. Mode Public / Tous les contacts (Visible par défaut sur StageLink)
    IF _story.privacy_type IS NULL OR _story.privacy_type = 'all_contacts' THEN RETURN TRUE; END IF;

    -- Si non authentifié et story privée (include_only / exclude), refuser
    IF _viewer_id IS NULL THEN RETURN FALSE; END IF;

    -- 5. Vérifier les exceptions granulaires (Whitelist / Blacklist)
    SELECT EXISTS(
        SELECT 1 FROM public.story_audience_rules 
        WHERE story_id = _story_id AND target_user_id = _viewer_id
    ) INTO _in_audience;

    IF _story.privacy_type = 'include_only' THEN RETURN _in_audience; END IF;
    IF _story.privacy_type = 'exclude' THEN RETURN NOT _in_audience; END IF;

    RETURN TRUE;
END;
$$;

-- ==============================================================================
-- 6. ENFORCING PERMISSIVE & ROBUST RLS ON STORIES
-- ==============================================================================
DROP POLICY IF EXISTS "Enable read for everyone" ON public.stories;
DROP POLICY IF EXISTS "Tout le monde peut voir les stories" ON public.stories;
DROP POLICY IF EXISTS "Stories are visible via Zero-Trust protocol" ON public.stories;
CREATE POLICY "Stories are visible via Zero-Trust protocol" ON public.stories
    FOR SELECT USING (public.can_view_story(id, auth.uid()));

DROP POLICY IF EXISTS "Tout le monde peut publier des stories" ON public.stories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.stories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent publier des stories" ON public.stories;
CREATE POLICY "Tout le monde peut publier des stories" ON public.stories
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Tout le monde peut supprimer des stories" ON public.stories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs stories" ON public.stories;
CREATE POLICY "Tout le monde peut supprimer des stories" ON public.stories
    FOR DELETE USING (true);

-- Audience Rules Table RLS
DROP POLICY IF EXISTS "Creators can manage their story audience rules" ON public.story_audience_rules;
CREATE POLICY "Creators can manage their story audience rules" ON public.story_audience_rules
    FOR ALL USING (true);

-- Story Views Table RLS
DROP POLICY IF EXISTS "Enable read for everyone" ON public.story_views;
DROP POLICY IF EXISTS "Creators can see viewers" ON public.story_views;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.story_views;
DROP POLICY IF EXISTS "Viewers can view if authorized" ON public.story_views;
DROP POLICY IF EXISTS "Tout le monde peut voir les vues" ON public.story_views;
DROP POLICY IF EXISTS "Tout le monde peut enregistrer une vue" ON public.story_views;
CREATE POLICY "Tout le monde peut voir les vues" ON public.story_views FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut enregistrer une vue" ON public.story_views FOR INSERT WITH CHECK (true);

-- Story Likes Table RLS
DROP POLICY IF EXISTS "Tout le monde peut liker une story" ON public.story_likes;
CREATE POLICY "Tout le monde peut liker une story" ON public.story_likes FOR ALL USING (true);

