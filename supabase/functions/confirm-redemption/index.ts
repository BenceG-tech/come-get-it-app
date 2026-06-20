import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type JsonRecord = Record<string, unknown>;

type TokenRow = {
  id: string;
  user_id: string;
  venue_id: string;
  drink_id: string | null;
  status: string;
  expires_at: string;
};

type VenueRow = {
  id: string;
  csr_enabled?: boolean | null;
  default_charity_id?: string | null;
  donation_per_redemption?: number | null;
};

type DrinkRow = {
  id: string;
  drink_name: string;
};

function json(data: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(supabaseUrl, serviceRole);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({})) as JsonRecord;
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) return json({ error: 'Missing token' }, 400);

  const tokenHash = await sha256Hex(token);
  const { data: tokenRow, error: tokenError } = await admin
    .from('redemption_tokens')
    .select('id,user_id,venue_id,drink_id,status,expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle<TokenRow>();

  if (tokenError) return json({ error: 'Token lookup failed', detail: tokenError.message }, 500);
  if (!tokenRow) return json({ error: 'Token not found' }, 404);
  if (tokenRow.user_id !== userData.user.id) return json({ error: 'Token belongs to another user' }, 403);
  if (tokenRow.status !== 'issued') return json({ error: 'Token already used' }, 409);
  if (new Date(tokenRow.expires_at).getTime() <= Date.now()) return json({ error: 'Token expired' }, 410);

  const { data: drink } = tokenRow.drink_id
    ? await admin.from('venue_drinks').select('id,drink_name').eq('id', tokenRow.drink_id).maybeSingle<DrinkRow>()
    : { data: null };

  const drinkName = drink?.drink_name ?? 'Ingyen ital';

  const { error: tokenUpdateError } = await admin
    .from('redemption_tokens')
    .update({ status: 'consumed', consumed_at: new Date().toISOString() })
    .eq('id', tokenRow.id)
    .eq('status', 'issued');

  if (tokenUpdateError) return json({ error: 'Token update failed', detail: tokenUpdateError.message }, 500);

  const { data: redemption, error: redemptionError } = await admin
    .from('redemptions')
    .insert({
      venue_id: tokenRow.venue_id,
      user_id: userData.user.id,
      drink: drinkName,
      drink_id: tokenRow.drink_id,
      value: 0,
      token_id: tokenRow.id,
      redeemed_at: new Date().toISOString(),
      status: 'redeemed',
      metadata: { flow: 'guest_button', impact_message: '+1 ember kap ma tiszta vizet' },
    })
    .select('id')
    .single<{ id: string }>();

  if (redemptionError) return json({ error: 'Redemption insert failed', detail: redemptionError.message }, 500);

  const { data: venue } = await admin
    .from('venues')
    .select('id,csr_enabled,default_charity_id,donation_per_redemption')
    .eq('id', tokenRow.venue_id)
    .maybeSingle<VenueRow>();

  let impactDelta = 0;
  if (venue?.csr_enabled && venue.default_charity_id) {
    const amountHuf = typeof venue.donation_per_redemption === 'number' && venue.donation_per_redemption > 0
      ? venue.donation_per_redemption
      : 250;
    const { error: donationError } = await admin.from('csr_donations').insert({
      redemption_id: redemption.id,
      user_id: userData.user.id,
      venue_id: tokenRow.venue_id,
      charity_id: venue.default_charity_id,
      amount_huf: amountHuf,
    });
    if (!donationError) impactDelta = 1;
  }

  const { count } = await admin
    .from('csr_donations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userData.user.id);

  return json({
    success: true,
    redemption_id: redemption.id,
    impact_delta: impactDelta || 1,
    impact_message: '+1 ember kap ma tiszta vizet',
    total_impact_units: count ?? null,
  });
});
