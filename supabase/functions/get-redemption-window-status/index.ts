import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, code: "NO_AUTH" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ success: false, code: "SERVER_CONFIG" }, 500);
    }

    const jwt = authHeader.slice("Bearer ".length);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser(jwt);
    if (authError || !user) {
      return jsonResponse({ success: false, code: "INVALID_AUTH" }, 401);
    }

    const body = await req.json().catch(() => null) as { token?: unknown } | null;
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!/^CGI-[A-Z0-9]{6}-[A-Za-z0-9]{32}$/.test(token)) {
      return jsonResponse({ success: false, code: "INVALID_FORMAT" }, 400);
    }

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const tokenHash = await sha256(token);
    const { data: foundToken, error: tokenError } = await service
      .from("redemption_tokens")
      .select("id,user_id,status,expires_at,consumed_at")
      .eq("token_hash", tokenHash)
      .eq("user_id", user.id)
      .maybeSingle();

    if (tokenError) {
      return jsonResponse({ success: false, code: "STATUS_LOOKUP_FAILED" }, 500);
    }
    if (!foundToken) {
      return jsonResponse({ success: false, code: "NOT_FOUND" }, 404);
    }

    let tokenData = foundToken;
    if (tokenData.status === "issued" && new Date(tokenData.expires_at).getTime() <= Date.now()) {
      const { data: expired, error: expiryError } = await service
        .from("redemption_tokens")
        .update({ status: "expired" })
        .eq("id", tokenData.id)
        .eq("status", "issued")
        .select("id")
        .maybeSingle();
      if (expiryError) return jsonResponse({ success: false, code: "STATUS_LOOKUP_FAILED" }, 500);
      if (expired) return jsonResponse({ success: true, status: "expired" });
      // A concurrent scan may have acquired the token lock first. Re-read its
      // committed result instead of announcing a false expiry.
      const { data: latest, error: latestError } = await service.from("redemption_tokens")
        .select("id,user_id,status,expires_at,consumed_at").eq("id", tokenData.id).eq("user_id", user.id).maybeSingle();
      if (latestError || !latest) return jsonResponse({ success: false, code: "STATUS_LOOKUP_FAILED" }, 500);
      tokenData = latest;
    }

    if (tokenData.status !== "consumed") {
      return jsonResponse({ success: true, status: tokenData.status });
    }

    const { data: redemption } = await service
      .from("redemptions")
      .select("id,drink,redeemed_at,venue_id,venues(name)")
      .eq("token_id", tokenData.id)
      .maybeSingle();

    return jsonResponse({
      success: true,
      status: "consumed",
      consumed_at: tokenData.consumed_at,
      redemption: redemption
        ? {
            id: redemption.id,
            drink_name: redemption.drink,
            redeemed_at: redemption.redeemed_at,
            venue_id: redemption.venue_id,
            venue_name: Array.isArray(redemption.venues)
              ? redemption.venues[0]?.name ?? null
              : (redemption.venues as { name?: string } | null)?.name ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Unexpected get-redemption-window-status error", error);
    return jsonResponse({ success: false, code: "INTERNAL_ERROR" }, 500);
  }
});
