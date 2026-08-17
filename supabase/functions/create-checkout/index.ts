import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const MONEROO_SECRET_KEY = Deno.env.get('MONEROO_SECRET_KEY') || 'moneroo_sk_test_mock';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, user_email, user_name, plan_type } = await req.json();

    const isYearly = plan_type === 'yearly';

    // Pricing Rule:
    // Monthly Plan: $6.00 / month
    // Yearly Plan (1st Time): $5.00 / month (10 paid months = $50.00 total + 2 months FREE = 12 months duration)
    const amount = isYearly ? 50.00 : 6.00;
    const currency = 'USD';
    const description = isYearly
      ? 'Abonnement StageLink Pass Annuel Gold VIP (5$/mois + 2 Mois Offerts)'
      : 'Abonnement StageLink Pass Mensuel Gold VIP (6$/mois)';

    // Moneroo Checkout API Payload
    const monerooPayload = {
      amount: amount,
      currency: currency,
      description: description,
      customer: {
        email: user_email,
        name: user_name || 'Artiste StageLink'
      },
      metadata: {
        user_id: user_id,
        plan_type: plan_type
      },
      return_url: 'https://stagelink.app/payment-success',
      cancel_url: 'https://stagelink.app/payment-cancel'
    };

    const monerooResponse = await fetch('https://api.moneroo.io/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MONEROO_SECRET_KEY}`
      },
      body: JSON.stringify(monerooPayload)
    });

    const monerooData = await monerooResponse.json();

    if (monerooData?.data?.checkout_url) {
      return new Response(
        JSON.stringify({ checkout_url: monerooData.data.checkout_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Fallback demo URL
    return new Response(
      JSON.stringify({ checkout_url: 'https://checkout.moneroo.io/demo-stagelink-pass' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

