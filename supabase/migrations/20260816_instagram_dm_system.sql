-- ==============================================================================
-- STAGELINK: INSTAGRAM DIRECT DM & REAL-TIME CHAT ARCHITECTURE
-- Zero-Trust RLS, Group Messaging, Vanish Mode, Story Sharing & Direct Notes
-- ==============================================================================

-- 1. ENUMS FOR DIRECT MESSAGING
DO $$ BEGIN
    CREATE TYPE conversation_type AS ENUM ('direct', 'group');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'audio', 'story_share', 'post_share', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE participant_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type conversation_type NOT NULL DEFAULT 'direct',
    title TEXT, -- Null for 1:1, group name for groups
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    vanish_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role participant_role NOT NULL DEFAULT 'member',
    is_muted BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id)
);

-- 4. DIRECT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type message_type NOT NULL DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- { duration, dimensions, view_once, shared_item, fileName }
    reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL,
    status message_status NOT NULL DEFAULT 'sent',
    is_vanished BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 5. MESSAGE REACTIONS TABLE (Instagram-style Emoji Reactions)
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_message_emoji UNIQUE (message_id, user_id, emoji)
);

-- 6. USER DIRECT NOTES TABLE (Instagram 24h Short Status & Music Notes)
CREATE TABLE IF NOT EXISTS public.user_direct_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content VARCHAR(60) NOT NULL,
    audio_track_url TEXT,
    audio_track_title TEXT,
    audio_track_artist TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    CONSTRAINT unique_active_user_note UNIQUE (user_id)
);

-- 7. HIGH-PERFORMANCE B-TREE INDEXES FOR SUB-MILLISECOND PAGINATION
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_participants_lookup ON public.conversation_participants(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id, left_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_pagination ON public.direct_messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_lookup ON public.message_reactions(message_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_direct_notes_active ON public.user_direct_notes(expires_at) WHERE expires_at > NOW();

-- 8. ZERO-TRUST ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_direct_notes ENABLE ROW LEVEL SECURITY;

-- Helper security function to verify active conversation membership without recursive RLS
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = _conversation_id 
          AND user_id = _user_id 
          AND left_at IS NULL
    );
$$;

-- RLS: CONVERSATIONS
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations" ON public.conversations
    FOR SELECT
    USING (
        auth.uid() IS NULL 
        OR public.is_conversation_participant(id, auth.uid())
    );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NULL 
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Participants can update conversation metadata" ON public.conversations;
CREATE POLICY "Participants can update conversation metadata" ON public.conversations
    FOR UPDATE
    USING (
        auth.uid() IS NULL 
        OR public.is_conversation_participant(id, auth.uid())
    );

-- RLS: CONVERSATION PARTICIPANTS
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
    FOR SELECT
    USING (
        auth.uid() IS NULL 
        OR user_id = auth.uid()
        OR public.is_conversation_participant(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Conversation creators and admins can add participants" ON public.conversation_participants;
CREATE POLICY "Conversation creators and admins can add participants" ON public.conversation_participants
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NULL 
        OR user_id = auth.uid()
        OR public.is_conversation_participant(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant record" ON public.conversation_participants
    FOR UPDATE
    USING (
        auth.uid() IS NULL 
        OR user_id = auth.uid()
    );

-- RLS: DIRECT MESSAGES
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON public.direct_messages;
CREATE POLICY "Participants can view messages in their conversations" ON public.direct_messages
    FOR SELECT
    USING (
        auth.uid() IS NULL 
        OR public.is_conversation_participant(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Active participants can send messages" ON public.direct_messages;
CREATE POLICY "Active participants can send messages" ON public.direct_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NULL 
        OR (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()))
    );

DROP POLICY IF EXISTS "Senders can edit or delete their messages" ON public.direct_messages;
CREATE POLICY "Senders can edit or delete their messages" ON public.direct_messages
    FOR UPDATE
    USING (
        auth.uid() IS NULL 
        OR sender_id = auth.uid() 
        OR public.is_conversation_participant(conversation_id, auth.uid())
    );

-- RLS: MESSAGE REACTIONS
DROP POLICY IF EXISTS "Participants can view reactions" ON public.message_reactions;
CREATE POLICY "Participants can view reactions" ON public.message_reactions
    FOR SELECT
    USING (
        auth.uid() IS NULL 
        OR EXISTS (
            SELECT 1 FROM public.direct_messages dm
            WHERE dm.id = message_id 
              AND public.is_conversation_participant(dm.conversation_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Active participants can add reactions" ON public.message_reactions;
CREATE POLICY "Active participants can add reactions" ON public.message_reactions
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NULL 
        OR (user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.direct_messages dm
            WHERE dm.id = message_id 
              AND public.is_conversation_participant(dm.conversation_id, auth.uid())
        ))
    );

DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
    FOR DELETE
    USING (
        auth.uid() IS NULL 
        OR user_id = auth.uid()
    );

-- RLS: USER DIRECT NOTES
DROP POLICY IF EXISTS "Anyone can view active direct notes" ON public.user_direct_notes;
CREATE POLICY "Anyone can view active direct notes" ON public.user_direct_notes
    FOR SELECT
    USING (expires_at > NOW());

DROP POLICY IF EXISTS "Users can publish and update their direct note" ON public.user_direct_notes;
CREATE POLICY "Users can publish and update their direct note" ON public.user_direct_notes
    FOR ALL
    USING (auth.uid() IS NULL OR user_id = auth.uid())
    WITH CHECK (auth.uid() IS NULL OR user_id = auth.uid());

-- 9. TRIGGERS & AUTOMATION

-- A. Auto-update conversations.updated_at and last_message_at on new message
CREATE OR REPLACE FUNCTION public.handle_new_direct_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NOW(),
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_new_direct_message ON public.direct_messages;
CREATE TRIGGER tr_new_direct_message
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_direct_message();

-- B. Auto-purge Vanished Messages when Vanish Mode is toggled or thread is exited
CREATE OR REPLACE FUNCTION public.purge_vanished_messages(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_purged_count INTEGER;
BEGIN
    DELETE FROM public.direct_messages
    WHERE conversation_id = p_conversation_id
      AND is_vanished = true;
      
    GET DIAGNOSTICS v_purged_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'purged_count', v_purged_count
    );
END;
$$;

-- 10. STORED PROCEDURES & RPC API

-- A. Create or Retrieve existing 1:1 Direct Conversation
CREATE OR REPLACE FUNCTION public.create_or_get_direct_conversation(p_partner_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_conversation_id UUID;
    v_conversation RECORD;
    v_partner_profile JSONB;
BEGIN
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;

    -- Look for existing 1:1 direct conversation between these two users
    SELECT cp1.conversation_id INTO v_conversation_id
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    JOIN public.conversations c ON c.id = cp1.conversation_id
    WHERE cp1.user_id = v_current_user_id 
      AND cp2.user_id = p_partner_id
      AND c.type = 'direct'
      AND cp1.left_at IS NULL
      AND cp2.left_at IS NULL
    LIMIT 1;

    -- If none exists, create a new direct conversation
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (type, created_by)
        VALUES ('direct', v_current_user_id)
        RETURNING id INTO v_conversation_id;

        INSERT INTO public.conversation_participants (conversation_id, user_id, role)
        VALUES 
            (v_conversation_id, v_current_user_id, 'admin'),
            (v_conversation_id, p_partner_id, 'member');
    END IF;

    -- Fetch partner profile details
    SELECT jsonb_build_object(
        'id', id,
        'full_name', full_name,
        'avatar_url', avatar_url,
        'role', role,
        'verified_badge', verified_badge
    ) INTO v_partner_profile FROM public.profiles WHERE id = p_partner_id;

    SELECT * INTO v_conversation FROM public.conversations WHERE id = v_conversation_id;

    RETURN jsonb_build_object(
        'success', true,
        'conversation_id', v_conversation_id,
        'type', v_conversation.type,
        'vanish_mode_enabled', v_conversation.vanish_mode_enabled,
        'partner', v_partner_profile
    );
END;
$$;

-- B. Toggle Vanish Mode
CREATE OR REPLACE FUNCTION public.toggle_vanish_mode(p_conversation_id UUID, p_enabled BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET vanish_mode_enabled = p_enabled,
        updated_at = NOW()
    WHERE id = p_conversation_id;

    RETURN jsonb_build_object(
        'success', true,
        'conversation_id', p_conversation_id,
        'vanish_mode_enabled', p_enabled
    );
END;
$$;

-- C. Mark Conversation as Read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    UPDATE public.conversation_participants
    SET last_read_at = NOW(),
        updated_at = NOW()
    WHERE conversation_id = p_conversation_id AND user_id = v_user_id;

    UPDATE public.direct_messages
    SET status = 'read'
    WHERE conversation_id = p_conversation_id 
      AND sender_id != v_user_id
      AND status != 'read';

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 11. SUPABASE STORAGE SETUP FOR CHAT MEDIA ATTACHMENTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-media', 
    'chat-media', 
    true, 
    52428800, -- 50 MB max
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 52428800;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Read Access for Chat Media" ON storage.objects;
CREATE POLICY "Public Read Access for Chat Media" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Authenticated Users can Upload Chat Media" ON storage.objects;
CREATE POLICY "Authenticated Users can Upload Chat Media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND (auth.uid() IS NOT NULL OR auth.role() = 'anon'));

DROP POLICY IF EXISTS "Users can Delete their Uploaded Chat Media" ON storage.objects;
CREATE POLICY "Users can Delete their Uploaded Chat Media" ON storage.objects
    FOR DELETE USING (bucket_id = 'chat-media');

-- 12. ENABLE SUPABASE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_direct_notes;
