const fs = require('fs');
const path = require('path');

// 1. SQL Migration
const sqlMigration = -- ==============================================================================
-- STAGELINK: ZERO-TRUST VOIP & WEBRTC REAL-TIME SIGNALING ENGINE
-- Architected for 1:1 and Group HD Audio & Video Communications
-- ==============================================================================

-- 1. ENUMS FOR VOIP PROTOCOLS
DO  BEGIN
    CREATE TYPE call_type AS ENUM ('audio', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END ;

DO  BEGIN
    CREATE TYPE call_status AS ENUM ('initiating', 'ringing', 'active', 'ended', 'missed', 'rejected', 'busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END ;

DO  BEGIN
    CREATE TYPE participant_call_status AS ENUM ('invited', 'ringing', 'joined', 'left', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END ;

DO  BEGIN
    CREATE TYPE call_signal_type AS ENUM ('offer', 'answer', 'ice_candidate', 'renegotiate', 'media_state', 'bye');
EXCEPTION
    WHEN duplicate_object THEN null;
END ;

-- 2. CALL SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type call_type NOT NULL DEFAULT 'audio',
    status call_status NOT NULL DEFAULT 'initiating',
    is_group BOOLEAN NOT NULL DEFAULT false,
    room_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    end_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CALL PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status participant_call_status NOT NULL DEFAULT 'invited',
    is_muted BOOLEAN DEFAULT false,
    is_video_off BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_call_participant UNIQUE (call_id, user_id)
);

-- 4. CALL SIGNALS TABLE (Low-latency Signaling Relay for SDP & ICE Candidates)
CREATE TABLE IF NOT EXISTS public.call_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    signal_type call_signal_type NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON public.call_sessions(caller_id, status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_room ON public.call_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_lookup ON public.call_participants(call_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON public.call_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_call_signals_relay ON public.call_signals(call_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_signals_sender ON public.call_signals(sender_id, created_at DESC);

-- 6. ZERO-TRUST RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_call_member(p_call_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS 
    SELECT EXISTS (
        SELECT 1 FROM public.call_sessions cs
        WHERE cs.id = p_call_id AND cs.caller_id = p_user_id
    ) OR EXISTS (
        SELECT 1 FROM public.call_participants cp
        WHERE cp.call_id = p_call_id AND cp.user_id = p_user_id
    );
;

DROP POLICY IF EXISTS Call members can view call sessions ON public.call_sessions;
CREATE POLICY Call members can view call sessions ON public.call_sessions FOR SELECT USING (caller_id = auth.uid() OR auth.uid() IS NULL OR public.is_call_member(id, auth.uid()));

DROP POLICY IF EXISTS Authenticated users can initiate call sessions ON public.call_sessions;
CREATE POLICY Authenticated users can initiate call sessions ON public.call_sessions FOR INSERT WITH CHECK (caller_id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS Call members can update call sessions ON public.call_sessions;
CREATE POLICY Call members can update call sessions ON public.call_sessions FOR UPDATE USING (caller_id = auth.uid() OR auth.uid() IS NULL OR public.is_call_member(id, auth.uid()));

DROP POLICY IF EXISTS Participants can view their call members ON public.call_participants;
CREATE POLICY Participants can view their call members ON public.call_participants FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NULL OR public.is_call_member(call_id, auth.uid()));

DROP POLICY IF EXISTS Call initiators and participants can insert participants ON public.call_participants;
CREATE POLICY Call initiators and participants can insert participants ON public.call_participants FOR INSERT WITH CHECK (auth.uid() IS NULL OR public.is_call_member(call_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS Participants can update their own call state ON public.call_participants;
CREATE POLICY Participants can update their own call state ON public.call_participants FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IS NULL OR public.is_call_member(call_id, auth.uid()));

DROP POLICY IF EXISTS Only target receivers and senders can view signals ON public.call_signals;
CREATE POLICY Only target receivers and senders can view signals ON public.call_signals FOR SELECT USING (auth.uid() IS NULL OR sender_id = auth.uid() OR receiver_id = auth.uid() OR (receiver_id IS NULL AND public.is_call_member(call_id, auth.uid())));

DROP POLICY IF EXISTS Call members can send signaling messages ON public.call_signals;
CREATE POLICY Call members can send signaling messages ON public.call_signals FOR INSERT WITH CHECK (auth.uid() IS NULL OR (sender_id = auth.uid() AND public.is_call_member(call_id, auth.uid())));

-- 7. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_call_session_lifecycle()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS 
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.connected_at IS NULL THEN
        NEW.connected_at = NOW();
    END IF;
    IF NEW.status IN ('ended', 'missed', 'rejected', 'busy') AND OLD.status NOT IN ('ended', 'missed', 'rejected', 'busy') THEN
        NEW.ended_at = COALESCE(NEW.ended_at, NOW());
        IF NEW.connected_at IS NOT NULL THEN
            NEW.duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (NEW.ended_at - NEW.connected_at))::INTEGER);
        ELSE
            NEW.duration_seconds = 0;
        END IF;
    END IF;
    RETURN NEW;
END;
;

DROP TRIGGER IF EXISTS tr_call_session_lifecycle ON public.call_sessions;
CREATE TRIGGER tr_call_session_lifecycle BEFORE UPDATE ON public.call_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_call_session_lifecycle();

CREATE OR REPLACE FUNCTION public.cleanup_finished_call_signals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS 
BEGIN
    IF NEW.status IN ('ended', 'missed', 'rejected', 'busy') THEN
        DELETE FROM public.call_signals WHERE call_id = NEW.id;
    END IF;
    RETURN NEW;
END;
;

DROP TRIGGER IF EXISTS tr_cleanup_call_signals ON public.call_sessions;
CREATE TRIGGER tr_cleanup_call_signals AFTER UPDATE ON public.call_sessions FOR EACH ROW WHEN (NEW.status IN ('ended', 'missed', 'rejected', 'busy')) EXECUTE FUNCTION public.cleanup_finished_call_signals();

-- 8. RPC PROCEDURES
CREATE OR REPLACE FUNCTION public.initiate_call(
    p_receiver_ids UUID[],
    p_call_type call_type DEFAULT 'audio',
    p_is_group BOOLEAN DEFAULT false,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS 
DECLARE
    v_caller_id UUID;
    v_call_id UUID;
    v_room_id TEXT;
    v_receiver_id UUID;
    v_is_busy BOOLEAN := false;
    v_caller_profile JSONB;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

    IF NOT p_is_group AND array_length(p_receiver_ids, 1) = 1 THEN
        SELECT EXISTS (
            SELECT 1 FROM public.call_participants cp
            JOIN public.call_sessions cs ON cs.id = cp.call_id
            WHERE cp.user_id = p_receiver_ids[1] AND cs.status IN ('initiating', 'ringing', 'active')
        ) INTO v_is_busy;
        IF v_is_busy THEN
            RETURN jsonb_build_object('success', false, 'error', 'USER_BUSY', 'message', 'Le correspondant est déjà en ligne');
        END IF;
    END IF;

    IF p_is_group THEN
        v_room_id := 'group_call_' || gen_random_uuid();
    ELSE
        v_room_id := 'call_' || LEAST(v_caller_id::text, p_receiver_ids[1]::text) || '_' || GREATEST(v_caller_id::text, p_receiver_ids[1]::text);
    END IF;

    INSERT INTO public.call_sessions (caller_id, call_type, status, is_group, room_id, metadata)
    VALUES (v_caller_id, p_call_type, 'ringing', p_is_group, v_room_id, p_metadata)
    RETURNING id INTO v_call_id;

    INSERT INTO public.call_participants (call_id, user_id, status, joined_at)
    VALUES (v_call_id, v_caller_id, 'joined', NOW());

    FOREACH v_receiver_id IN ARRAY p_receiver_ids LOOP
        INSERT INTO public.call_participants (call_id, user_id, status)
        VALUES (v_call_id, v_receiver_id, 'ringing');

        INSERT INTO public.notifications (user_id, actor_id, type, reference_id)
        VALUES (v_receiver_id, v_caller_id, CASE WHEN p_call_type = 'video' THEN 'incoming_call_video' ELSE 'incoming_call_audio' END, v_call_id);
    END LOOP;

    SELECT jsonb_build_object('id', id, 'full_name', full_name, 'avatar_url', avatar_url, 'role', role)
    INTO v_caller_profile FROM public.profiles WHERE id = v_caller_id;

    RETURN jsonb_build_object('success', true, 'call_id', v_call_id, 'room_id', v_room_id, 'call_type', p_call_type, 'caller', v_caller_profile, 'status', 'ringing');
END;
;

CREATE OR REPLACE FUNCTION public.answer_call(p_call_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS 
DECLARE
    v_user_id UUID;
    v_call RECORD;
BEGIN
    v_user_id := auth.uid();
    SELECT * INTO v_call FROM public.call_sessions WHERE id = p_call_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'CALL_NOT_FOUND'); END IF;

    UPDATE public.call_participants SET status = 'joined', joined_at = NOW(), updated_at = NOW() WHERE call_id = p_call_id AND user_id = v_user_id;
    UPDATE public.call_sessions SET status = 'active', connected_at = COALESCE(connected_at, NOW()), updated_at = NOW() WHERE id = p_call_id;

    RETURN jsonb_build_object('success', true, 'call_id', p_call_id, 'status', 'active');
END;
;

CREATE OR REPLACE FUNCTION public.end_call(p_call_id UUID, p_reason TEXT DEFAULT 'normal_hangup')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS 
DECLARE
    v_user_id UUID;
    v_call RECORD;
    v_active_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    SELECT * INTO v_call FROM public.call_sessions WHERE id = p_call_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'CALL_NOT_FOUND'); END IF;

    UPDATE public.call_participants
    SET status = CASE WHEN v_call.status = 'ringing' AND v_user_id != v_call.caller_id THEN 'declined' ELSE 'left' END, left_at = NOW(), updated_at = NOW()
    WHERE call_id = p_call_id AND user_id = v_user_id;

    SELECT count(*) INTO v_active_count FROM public.call_participants WHERE call_id = p_call_id AND status = 'joined';

    IF NOT v_call.is_group OR v_active_count <= 1 OR v_user_id = v_call.caller_id THEN
        UPDATE public.call_sessions
        SET status = CASE WHEN v_call.status = 'ringing' AND v_user_id != v_call.caller_id THEN 'rejected' WHEN v_call.status = 'ringing' AND v_user_id = v_call.caller_id THEN 'missed' ELSE 'ended' END,
            ended_at = NOW(), end_reason = p_reason, updated_at = NOW()
        WHERE id = p_call_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'call_id', p_call_id, 'status', 'ended');
END;
;

-- 9. REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
;

fs.writeFileSync('d:/PC Toshiba/JABE PRODUCTION/StageLink/supabase/migrations/20260816_voip_webrtc_system.sql', sqlMigration, 'utf8');
console.log('1. Generated supabase/migrations/20260816_voip_webrtc_system.sql');
