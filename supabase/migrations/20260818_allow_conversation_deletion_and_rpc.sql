-- ==============================================================================
-- STAGELINK: PERMANENT CONVERSATION DELETION & ZERO-TRUST POLICIES
-- Adds DELETE policies and atomic delete_user_conversation RPC
-- ==============================================================================

-- 1. DELETE POLICIES FOR CONVERSATIONS & PARTICIPANTS & DIRECT MESSAGES
DROP POLICY IF EXISTS "Participants can delete their conversations" ON public.conversations;
CREATE POLICY "Participants can delete their conversations" ON public.conversations
    FOR DELETE
    USING (
        auth.uid() IS NULL 
        OR created_by = auth.uid() 
        OR public.is_conversation_participant(id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own participant record" ON public.conversation_participants;
CREATE POLICY "Users can delete their own participant record" ON public.conversation_participants
    FOR DELETE
    USING (
        auth.uid() IS NULL 
        OR user_id = auth.uid() 
        OR public.is_conversation_participant(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Participants can delete direct messages" ON public.direct_messages;
CREATE POLICY "Participants can delete direct messages" ON public.direct_messages
    FOR DELETE
    USING (
        auth.uid() IS NULL 
        OR sender_id = auth.uid() 
        OR public.is_conversation_participant(conversation_id, auth.uid())
    );

-- 2. ATOMIC RPC TO PERMANENTLY DELETE A CONVERSATION FOR A USER
CREATE OR REPLACE FUNCTION public.delete_user_conversation(p_conversation_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_partner_id UUID;
    v_remaining_count INT;
BEGIN
    -- 1. Identify conversation partner
    SELECT user_id INTO v_partner_id
    FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id != p_user_id
    LIMIT 1;

    -- 2. Mark left_at and remove participant
    UPDATE public.conversation_participants
    SET left_at = NOW(),
        updated_at = NOW()
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

    DELETE FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

    -- 3. If partner exists, upsert chat_states to mark deleted for this user
    IF v_partner_id IS NOT NULL THEN
        INSERT INTO public.chat_states (user_id, partner_id, is_deleted, updated_at)
        VALUES (p_user_id, v_partner_id, true, NOW())
        ON CONFLICT (user_id, partner_id)
        DO UPDATE SET is_deleted = true, updated_at = NOW();

        -- Also delete any legacy messages between them
        DELETE FROM public.messages
        WHERE (sender_id = p_user_id AND receiver_id = v_partner_id)
           OR (sender_id = v_partner_id AND receiver_id = p_user_id);
    END IF;

    -- 4. Clean notifications
    DELETE FROM public.notifications
    WHERE user_id = p_user_id AND reference_id = p_conversation_id::text;

    IF v_partner_id IS NOT NULL THEN
        DELETE FROM public.notifications
        WHERE user_id = p_user_id AND actor_id = v_partner_id AND type = 'message';
    END IF;

    -- 5. If no active participants remain, purge messages and conversation
    SELECT COUNT(*) INTO v_remaining_count
    FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND left_at IS NULL;

    IF v_remaining_count = 0 THEN
        DELETE FROM public.direct_messages WHERE conversation_id = p_conversation_id;
        DELETE FROM public.conversation_participants WHERE conversation_id = p_conversation_id;
        DELETE FROM public.conversations WHERE id = p_conversation_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'conversation_id', p_conversation_id,
        'partner_id', v_partner_id
    );
END;
$$;
