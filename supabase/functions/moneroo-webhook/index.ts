// Supabase Edge Function: moneroo-webhook
// Validates HMAC X-Moneroo-Signature and activates StageLink subscription in Supabase DB

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

declare const Deno: any;

const MONEROO_SECRET_KEY = Deno.env.get("MONEROO_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifyHmacSignature(bodyText: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(bodyText);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, msgData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSignature.toLowerCase() === signatureHeader.toLowerCase();
  } catch (err) {
    console.error("HMAC verification error:", err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  try {
    const signature = req.headers.get("X-Moneroo-Signature") || req.headers.get("x-moneroo-signature");
    const rawBody = await req.text();

    // Verify Moneroo HMAC Signature
    const isValidSignature = await verifyHmacSignature(rawBody, signature, MONEROO_SECRET_KEY);
    if (!isValidSignature && MONEROO_SECRET_KEY !== "") {
      console.warn("Invalid Moneroo Webhook Signature");
      return new Response(JSON.stringify({ error: "Signature HMAC invalide" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event || payload.type;
    const data = payload.data || payload;

    console.log(`Moneroo Webhook Event Received: ${event}`, data);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Process successful payment events
    if (event === "payment.success" || event === "payment.completed" || data.status === "success") {
      const paymentId = data.id || data.payment_id;
      const metadata = data.metadata || {};
      const userId = metadata.user_id;

      if (paymentId) {
        // 1. Update subscription status to active in database
        const { data: subData } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString()
          })
          .eq("moneroo_payment_id", paymentId)
          .select("user_id")
          .single();

        const targetUserId = userId || subData?.user_id;

        // 2. Activate user profile (gold badge & verified)
        if (targetUserId) {
          await supabase
            .from("profiles")
            .update({
              verified: true,
              badge_type: "gold"
            })
            .eq("id", targetUserId);

          console.log(`Successfully activated Gold VIP profile for user ${targetUserId}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Webhook Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
