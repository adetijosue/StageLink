-- ================================================================
--  StageLink — Script RLS Complémentaire
--  Comble les tables MANQUANTES du schéma original et corrige
--  la politique bypass sur stories.
--  À coller dans Supabase → SQL Editor → New Query → Run
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- 1. TABLES MANQUANTES — Messagerie directe avancée
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.conversations (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type                TEXT DEFAULT 'direct',
    vanish_mode_enabled BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id   UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    last_read_at      TIMESTAMP WITH TIME ZONE,
    left_at           TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id   UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message_type      TEXT DEFAULT 'text',
    content           TEXT,
    media_url         TEXT,
    metadata          JSONB DEFAULT '{}'::jsonb,
    reply_to_id       UUID,
    status            TEXT DEFAULT 'sent',
    is_vanished       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id    UUID REFERENCES public.direct_messages(id) ON DELETE CASCADE NOT NULL,
    user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji         TEXT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.user_direct_notes (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    content             TEXT,
    audio_track_url     TEXT,
    audio_track_title   TEXT,
    audio_track_artist  TEXT,
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- ════════════════════════════════════════════════════════════════
-- 2. INDEXES DE PERFORMANCE
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv    ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user    ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversation           ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_sender                 ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at             ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_reactions_message     ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user           ON public.user_direct_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_expires        ON public.user_direct_notes(expires_at);


-- ════════════════════════════════════════════════════════════════
-- 3. RLS — Activer Row Level Security
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_direct_notes         ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════════
-- 4. POLITIQUES RLS — Conversations
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "participants_select_conversations" ON public.conversations;
CREATE POLICY "participants_select_conversations"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
              AND cp.user_id = auth.uid()
              AND cp.left_at IS NULL
        )
    );

DROP POLICY IF EXISTS "auth_insert_conversations" ON public.conversations;
CREATE POLICY "auth_insert_conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "participants_update_conversations" ON public.conversations;
CREATE POLICY "participants_update_conversations"
    ON public.conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
              AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "participants_delete_conversations" ON public.conversations;
CREATE POLICY "participants_delete_conversations"
    ON public.conversations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
              AND cp.user_id = auth.uid()
        )
    );


-- ════════════════════════════════════════════════════════════════
-- 5. POLITIQUES RLS — Participants de conversation
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "select_own_participations" ON public.conversation_participants;
CREATE POLICY "select_own_participations"
    ON public.conversation_participants FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.conversation_participants cp2
            WHERE cp2.conversation_id = conversation_id
              AND cp2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "auth_insert_participations" ON public.conversation_participants;
CREATE POLICY "auth_insert_participations"
    ON public.conversation_participants FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "update_own_participation" ON public.conversation_participants;
CREATE POLICY "update_own_participation"
    ON public.conversation_participants FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_participation" ON public.conversation_participants;
CREATE POLICY "delete_own_participation"
    ON public.conversation_participants FOR DELETE
    USING (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- 6. POLITIQUES RLS — Messages directs
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "participants_select_dm" ON public.direct_messages;
CREATE POLICY "participants_select_dm"
    ON public.direct_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = direct_messages.conversation_id
              AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "sender_insert_dm" ON public.direct_messages;
CREATE POLICY "sender_insert_dm"
    ON public.direct_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "participants_update_dm" ON public.direct_messages;
CREATE POLICY "participants_update_dm"
    ON public.direct_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = direct_messages.conversation_id
              AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "sender_delete_dm" ON public.direct_messages;
CREATE POLICY "sender_delete_dm"
    ON public.direct_messages FOR DELETE
    USING (auth.uid() = sender_id);


-- ════════════════════════════════════════════════════════════════
-- 7. POLITIQUES RLS — Réactions aux messages
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "participants_select_reactions" ON public.message_reactions;
CREATE POLICY "participants_select_reactions"
    ON public.message_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.direct_messages dm
            JOIN public.conversation_participants cp ON cp.conversation_id = dm.conversation_id
            WHERE dm.id = message_reactions.message_id
              AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "auth_insert_reactions" ON public.message_reactions;
CREATE POLICY "auth_insert_reactions"
    ON public.message_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_delete_reactions" ON public.message_reactions;
CREATE POLICY "own_delete_reactions"
    ON public.message_reactions FOR DELETE
    USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════
-- 8. POLITIQUES RLS — Notes directes (Direct Notes 24h)
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "public_select_notes" ON public.user_direct_notes;
CREATE POLICY "public_select_notes"
    ON public.user_direct_notes FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "own_insert_notes" ON public.user_direct_notes;
CREATE POLICY "own_insert_notes"
    ON public.user_direct_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_update_notes" ON public.user_direct_notes;
CREATE POLICY "own_update_notes"
    ON public.user_direct_notes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_delete_notes" ON public.user_direct_notes;
CREATE POLICY "own_delete_notes"
    ON public.user_direct_notes FOR DELETE
    USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════
-- 9. CORRECTION — Politique Stories bypass (OR true)
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Tout le monde peut supprimer des stories" ON public.stories;


-- ════════════════════════════════════════════════════════════════
-- 10. REALTIME — Ajouter les nouvelles tables
-- ════════════════════════════════════════════════════════════════
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;


-- ════════════════════════════════════════════════════════════════
-- 11. NETTOYAGE — Supprimer les notes directes expirées
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cleanup_expired_notes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_direct_notes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


NOTIFY pgrst, 'reload schema';
-- ════════════════════════════════════════════════════════════════
--  SCRIPT TERMINÉ — Tables et RLS complémentaires appliqués !
-- ════════════════════════════════════════════════════════════════
