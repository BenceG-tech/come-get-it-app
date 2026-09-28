import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REWARD_PUBLIC_COLUMNS = 'id,venue_id,name,description,points_required,valid_until,active,image_url,category,is_global,partner_id,priority,terms_conditions,max_redemptions,current_redemptions';

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function today(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceRole);

  const authHeader = req.headers.get('Authorization') ?? '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) return json({ error: 'Unauthorized' }, 401);
  const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const venueId = typeof body.venue_id === 'string' ? body.venue_id.trim() : '';

  let query = admin
    .from('rewards')
    .select(REWARD_PUBLIC_COLUMNS)
    .eq('active', true)
    .gte('valid_until', today())
    .order('priority', { ascending: false, nullsFirst: false })
    .order('points_required', { ascending: true });

  if (UUID_RE.test(venueId)) {
    query = query.or(`venue_id.eq.${venueId},partner_id.eq.${venueId},is_global.eq.true`);
  } else {
    query = query.eq('is_global', true);
  }

  const { data, error } = await query;
  if (error) return json({ success: false, error: error.message }, 500);

  const rows = Array.isArray(data) ? data : [];
  const venueIds = [...new Set(rows.flatMap((reward) => [reward.venue_id, reward.partner_id]).filter((id): id is string => typeof id === 'string'))];
  const activeVenueIds = new Set<string>();
  if (venueIds.length > 0) {
    const { data: venues, error: venueError } = await admin
      .from('venues')
      .select('id')
      .in('id', venueIds)
      .eq('is_paused', false);
    if (venueError) return json({ success: false, error: venueError.message }, 500);
    for (const venue of venues ?? []) activeVenueIds.add(String(venue.id));
  }

  const rewards = rows.filter((reward) => {
    const stockAvailable = reward.max_redemptions === null
      || Number(reward.current_redemptions ?? 0) < Number(reward.max_redemptions);
    const venueAvailable = reward.is_global === true
      || activeVenueIds.has(String(reward.venue_id ?? ''))
      || activeVenueIds.has(String(reward.partner_id ?? ''));
    return stockAvailable && venueAvailable;
  });

  return json({ success: true, rewards });
});
