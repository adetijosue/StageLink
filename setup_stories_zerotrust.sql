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
CREATE OR REPLACE FUNCTION public.can_view_story(_story_id UUID, _viewer_id UUID)
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
    
    -- 3. Le créateur a toujours un accès total
    IF _story.user_id = _viewer_id THEN RETURN TRUE; END IF;

    -- 4. Vérifier si l'utilisateur fait partie du réseau (Abonné)
    SELECT EXISTS(
        SELECT 1 FROM public.followers 
        WHERE follower_id = _viewer_id AND following_id = _story.user_id
    ) INTO _is_contact;
    
    -- Dans StageLink, pour voir une story privée, on doit au moins être abonné
    IF NOT _is_contact THEN RETURN FALSE; END IF;

    -- 5. Logique Granulaire de Confidentialité
    IF _story.privacy_type = 'all_contacts' THEN RETURN TRUE; END IF;

    -- Vérifier les exceptions (Whitelist/Blacklist)
    SELECT EXISTS(
        SELECT 1 FROM public.story_audience_rules 
        WHERE story_id = _story_id AND target_user_id = _viewer_id
    ) INTO _in_audience;

    IF _story.privacy_type = 'include_only' THEN RETURN _in_audience; END IF;
    IF _story.privacy_type = 'exclude' THEN RETURN NOT _in_audience; END IF;

    RETURN FALSE;
END;
$$;

-- ==============================================================================
-- 6. ENFORCING RLS ON STORIES
-- ==============================================================================
-- On force le passage par la fonction de validation sur les selects
DROP POLICY IF EXISTS "Enable read for everyone" ON public.stories;
CREATE POLICY "Stories are visible via Zero-Trust protocol" ON public.stories
    FOR SELECT USING (public.can_view_story(id, auth.uid()));

-- Restreindre la visibilité des audiences privées (Règles)
CREATE POLICY "Creators can manage their story audience rules" ON public.story_audience_rules
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.stories s WHERE s.id = story_audience_rules.story_id AND s.user_id = auth.uid())
    );

-- Mise à jour RLS des vues pour respecter la nouvelle architecture
DROP POLICY IF EXISTS "Enable read for everyone" ON public.story_views;
CREATE POLICY "Creators can see viewers" ON public.story_views 
    FOR SELECT USING (EXISTS(SELECT 1 FROM public.stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.story_views;
CREATE POLICY "Viewers can view if authorized" ON public.story_views 
    FOR INSERT WITH CHECK (
        auth.uid() = viewer_id AND public.can_view_story(story_id, auth.uid())
    );
