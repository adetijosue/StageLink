-- Migration: Create Subscriptions Table for Moneroo Payment Gateway
-- Date: 2026-07-24

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moneroo_payment_id TEXT UNIQUE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'trialing', 'canceled', 'expired')),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 6.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_first_subscription BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast query by user_id & moneroo_payment_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_moneroo_id ON public.subscriptions(moneroo_payment_id);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
    ON public.subscriptions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all subscriptions
CREATE POLICY "Service role full access on subscriptions" 
    ON public.subscriptions 
    FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role');
