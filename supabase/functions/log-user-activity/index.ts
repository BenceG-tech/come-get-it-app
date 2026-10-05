import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivityLogRequest {
  event_type: string;
  venue_id?: string;
  metadata?: Record<string, unknown>;
  device_info?: string;
  app_version?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn("Activity authorization failed");
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > 4096) return new Response(null, { status: 413, headers: corsHeaders });
    let body: ActivityLogRequest;
    try { body = JSON.parse(rawBody); } catch { return new Response(null, { status: 400, headers: corsHeaders }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response(null, { status: 400, headers: corsHeaders });
    const { event_type, venue_id, metadata, device_info, app_version } = body;

    // Validate event_type
    const validEventTypes = [
      "app_open",
      "app_close",
      "login",
      "signup",
      "qr_generated",
      "venue_viewed",
      "reward_viewed",
      "redemption_attempt",
      "redemption_success",
      "profile_viewed",
      "search_performed",
      "notification_received",
      "notification_clicked"
    ];

    if (!event_type || !validEventTypes.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid event_type. Must be one of: ${validEventTypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (venue_id && (typeof venue_id !== 'string' || !uuid.test(venue_id))) {
      return new Response(JSON.stringify({ error: 'Invalid venue_id' }), { status: 400, headers: corsHeaders });
    }
    // An allowlist prevents raw QR tokens, coordinates and free text from entering analytics.
    const safeMetadata: Record<string, unknown> = {};
    if (metadata?.source === 'mobile') safeMetadata.source = 'mobile';
    if (['free_drink','points_reward'].includes(String(metadata?.flow))) safeMetadata.flow = metadata!.flow;
    if (['started','failed','expired','revoked','closed','restored'].includes(String(metadata?.outcome))) safeMetadata.outcome = metadata!.outcome;
    if (typeof metadata?.duration_ms === 'number' && Number.isFinite(metadata.duration_ms) && metadata.duration_ms >= 0 && metadata.duration_ms <= 120000) {
      safeMetadata.duration_ms = Math.round(metadata.duration_ms);
    }
    const platform = ['ios','android','web'].includes(String(device_info)) ? device_info : null;
    const version = typeof app_version === 'string' && /^[a-zA-Z0-9.+-]{1,40}$/.test(app_version) ? app_version : null;
    const { count, error: limitError } = await supabase.from('user_activity_logs')
      .select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60000).toISOString());
    if (limitError) return new Response(null, { status: 503, headers: corsHeaders });
    if ((count ?? 0) >= 120) return new Response(null, { status: 429, headers: corsHeaders });

    // Insert activity log
    const { error: insertError } = await supabase
      .from("user_activity_logs")
      .insert({
        user_id: user.id,
        event_type,
        venue_id: venue_id || null,
        metadata: safeMetadata,
        device_info: platform,
        app_version: version,
        ip_address: null
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to log activity" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_seen_at in profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        last_seen_at: new Date().toISOString(),
        device_info: platform ? { latest: platform, app_version: version } : undefined
      })
      .eq("id", user.id);

    if (updateError) {
      console.warn("Failed to update profile last_seen_at:", updateError);
      // Don't fail the request, just log
    }

    // No user IDs, request bodies or bearer tokens in function logs.

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error logging activity:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
