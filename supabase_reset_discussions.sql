-- =========================================================================
-- NETTOYAGE PROFOND ET RÉACTIVATION DES DISCUSSIONS STAGELINK
-- =========================================================================

-- 1. Nettoyage profond : Effacer toutes les discussions et notifications existantes
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.chat_states CASCADE;

-- 2. Mise à jour de la table des messages avec les colonnes manquantes
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Création de la table 'notifications' (si elle manquait)
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
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Les utilisateurs voient leurs propres notifications" 
        ON public.notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Tout le monde peut inserer des notifications"
        ON public.notifications FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 4. Création de la table 'chat_states' pour la gestion des suppressions
CREATE TABLE IF NOT EXISTS public.chat_states (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    partner_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status              TEXT DEFAULT 'active', -- active, archived, deleted
    cleared_at          TIMESTAMP WITH TIME ZONE,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_states_user_id ON public.chat_states(user_id);
ALTER TABLE public.chat_states ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Les utilisateurs voient leurs chat states" 
        ON public.chat_states FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Les utilisateurs gerent leurs chat states"
        ON public.chat_states FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 5. Activation du système Temps Réel (Realtime) OBLIGATOIRE
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_states;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
