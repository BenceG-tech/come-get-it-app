// Simulates a bank transaction so the whole spend -> match -> points -> report chain can be tested
// before a Salt Edge contract exists. Works only while SALTEDGE_MODE=mock, and only for admins.
// Auth: gateway JWT (verify_jwt = true) + auth.getUser() + profiles.is_admin check here.
// POST { user_id, venue_id, amount_huf, made_on?: 'YYYY-MM-DD', refund?: boolean, pending?: boolean, description?: string }
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  CONSENT_PERIOD_DAYS,
  type SaltEdgeTransaction,
  corsHeaders,
  getMode,
  json,
  loadMatchableVenues,
  processTransactions,
} from '../_shared/saltedge.ts';

type MockRequest = {
  user_id?: string;
  venue_id?: string;
  amount_huf?: number;
  made_on?: string;
  refund?: boolean;
  pending?: boolean;
  description?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (getMode() !== 'mock') return json({ error: 'MOCK_MODE_ONLY' }, 403);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);
  const { data: caller } = await admin.from('profiles').select('is_admin').eq('id', userData.user.id).maybeSingle();
  if (!caller?.is_admin) return json({ error: 'Forbidden' }, 403);

  const body = await req.json().catch(() => ({})) as MockRequest;
  const amount = Number(body.amount_huf);
  if (!body.user_id || !body.venue_id || !Number.isFinite(amount) || amount <= 0) {
    return json({ error: 'user_id, venue_id and a positive amount_huf are required' }, 400);
  }

  const venues = await loadMatchableVenues(admin);
  const venue = venues.find((v) => v.id === body.venue_id);
  const rules = venue?.merchant_match_rules ?? {};
  const merchantName = rules.names?.[0] ?? rules.contains?.[0];
  if (!venue || !merchantName) {
    return json({ error: 'NO_MATCH_RULES', message: 'Előbb adj meg partnerazonosítási szabályt (név vagy kulcsszó) ennél a helynél.' }, 400);
  }

  // Reuse the user's mock connection, or create one as if they had linked a bank today.
  let { data: customer } = await admin
    .from('saltedge_customers')
    .select('id')
    .eq('user_id', body.user_id)
    .eq('mode', 'mock')
    .maybeSingle();
  if (!customer) {
    const { data, error } = await admin
      .from('saltedge_customers')
      .insert({ user_id: body.user_id, se_customer_id: `mock-${crypto.randomUUID()}`, status: 'active', mode: 'mock' })
      .select('id')
      .single();
    if (error) return json({ error: error.message }, 500);
    customer = data;
  }

  let { data: connection } = await admin
    .from('saltedge_connections')
    .select('id')
    .eq('customer_id', customer.id)
    .is('revoked_at', null)
    .order('linked_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!connection) {
    const { data, error } = await admin
      .from('saltedge_connections')
      .insert({
        se_connection_id: `mock-${crypto.randomUUID()}`,
        customer_id: customer.id,
        provider_name: 'Tesztbank (mock)',
        provider_code: 'mock',
        status: 'active',
        linked_at: body.made_on ? `${body.made_on}T00:00:00+02:00` : new Date().toISOString(),
        consent_expires_at: new Date(Date.now() + CONSENT_PERIOD_DAYS * 86_400_000).toISOString(),
      })
      .select('id')
      .single();
    if (error) return json({ error: error.message }, 500);
    connection = data;
  }

  const madeOn = body.made_on ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest' }).format(new Date());
  const tx: SaltEdgeTransaction = {
    id: `mock-${crypto.randomUUID()}`,
    status: body.pending ? 'pending' : 'posted',
    made_on: madeOn,
    amount: body.refund ? amount : -amount,
    currency_code: 'HUF',
    description: body.description ?? `Kártyás vásárlás ${merchantName.toUpperCase()} BUDAPEST`,
    extra: { payee: merchantName.toUpperCase(), mcc: '5813' },
  };

  const stats = await processTransactions(admin, { id: connection.id, user_id: body.user_id }, [tx], venues);
  const { data: stored } = await admin
    .from('saltedge_transactions')
    .select('id, points_awarded, points_status, match_method')
    .eq('se_transaction_id', tx.id)
    .maybeSingle();

  return json({ ok: true, stats, transaction: stored });
});
