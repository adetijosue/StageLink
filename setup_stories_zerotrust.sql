-- ==============================================================================
-- STAGELINK: ZERO-RECURSION ULTRA-FAST EPHEMERAL STORIES MIGRATION
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

-- 4. CLEANUP ALL BROKEN / RECURSIVE POLICIES
DROP POLICY IF EXISTS "Enable read for everyone" ON public.stories;
DROP POLICY IF EXISTS "Tout le monde peut voir les stories" ON public.stories;
DROP POLICY IF EXISTS "Stories are visible via Zero-Trust protocol" ON public.stories;
DROP POLICY IF EXISTS "Public read active stories" ON public.stories;
DROP POLICY IF EXISTS "Tout le monde peut publier des stories" ON public.stories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.stories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent publier des stories" ON public.stories;
DROP POLICY IF EXISTS "Public insert stories" ON public.stories;
DROP POLICY IF EXISTS "Tout le monde peut supprimer des stories" ON public.stories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs stories" ON public.stories;
DROP POLICY IF EXISTS "Public delete stories" ON public.stories;
DROP POLICY IF EXISTS "Public update stories" ON public.stories;

-- 5. ZERO-RECURSION ULTRA-FAST RLS POLICIES FOR STORIES
CREATE POLICY "Public read active stories" ON public.stories
    FOR SELECT
    USING (
        (expires_at IS NULL OR expires_at > NOW()) AND (
            privacy_type IS NULL OR 
            privacy_type = 'all_contacts' OR
            auth.uid() = user_id OR
            (privacy_type = 'include_only' AND EXISTS (SELECT 1 FROM public.story_audience_rules WHERE story_id = public.stories.id AND target_user_id = auth.uid())) OR
            (privacy_type = 'exclude' AND NOT EXISTS (SELECT 1 FROM public.story_audience_rules WHERE story_id = public.stories.id AND target_user_id = auth.uid()))
        )
    );

CREATE POLICY "Public insert stories" ON public.stories
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public update stories" ON public.stories
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public delete stories" ON public.stories
    FOR DELETE
    USING (true);

-- 6. AUDIENCE RULES TABLE RLS
DROP POLICY IF EXISTS "Creators can manage their story audience rules" ON public.story_audience_rules;
CREATE POLICY "Creators can manage their story audience rules" ON public.story_audience_rules
    FOR ALL USING (true);

-- 7. STORY VIEWS TABLE RLS
DROP POLICY IF EXISTS "Enable read for everyone" ON public.story_views;
DROP POLICY IF EXISTS "Creators can see viewers" ON public.story_views;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.story_views;
DROP POLICY IF EXISTS "Viewers can view if authorized" ON public.story_views;
DROP POLICY IF EXISTS "Tout le monde peut voir les vues" ON public.story_views;
DROP POLICY IF EXISTS "Tout le monde peut enregistrer une vue" ON public.story_views;
CREATE POLICY "Tout le monde peut voir les vues" ON public.story_views FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut enregistrer une vue" ON public.story_views FOR INSERT WITH CHECK (true);

-- 8. STORY LIKES TABLE RLS
DROP POLICY IF EXISTS "Tout le monde peut liker une story" ON public.story_likes;
CREATE POLICY "Tout le monde peut liker une story" ON public.story_likes FOR ALL USING (true);

-- 9. ACTIVATE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes;

