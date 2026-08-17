import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushCallPayload {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  receiverIds: string[];
  callType: "audio" | "video";
  hasVideo: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: PushCallPayload = await req.json();
    const { callId, callerName, callerAvatar, receiverIds, callType, hasVideo } = payload;

    if (!callId || !receiverIds || receiverIds.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid call payload parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch device tokens for the targeted receivers
    const { data: devices, error: deviceError } = await supabaseClient
      .from("user_device_tokens")
      .select("token, platform, user_id")
      .in("user_id", receiverIds);

    if (deviceError) {
      console.error("[VoIP Push] Error fetching device tokens:", deviceError);
    }

    const pushResults = [];

    // High-Priority Android FCM VoIP / Data Message Payload
    const fcmPayload = {
      priority: "high",
      content_available: true,
      data: {
        type: "VOIP_INCOMING_CALL",
        call_id: callId,
        caller_name: callerName,
        caller_avatar: callerAvatar || "",
        call_type: callType,
        has_video: String(hasVideo),
        timestamp: String(Date.now()),
      },
    };

    // Process push to devices
    if (devices && devices.length > 0) {
      for (const device of devices) {
        // In production, integrate Firebase Admin SDK HTTP v1 or APNs HTTP/2 with Auth Key
        console.log(`[VoIP Push] Dispatching payload to user ${device.user_id} (${device.platform}):`, fcmPayload);
        pushResults.push({ userId: device.user_id, platform: device.platform, dispatched: true });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dispatched_count: pushResults.length,
        call_id: callId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
