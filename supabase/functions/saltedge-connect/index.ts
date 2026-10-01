// Mobile app entry point for spend-based points.
// Auth: gateway JWT (verify_jwt = true) + auth.getUser() here; all writes use the service role.
// POST { action: 'status' | 'connect' | 'disconnect', connection_id?: string }
import { createClient } from 'npm:@supabase/supabase-js@2';
import { CONSENT_PERIOD_DAYS, SaltEdgeClient, corsHeaders, customerMode, getMode, json } from '../_shared/saltedge.ts';

const RETURN_TO = Deno.env.get('SALTEDGE_RETURN_TO') ?? 'comegetit://spend-points';

type ConnectionRow = {
  id: string;
  se_connection_id: string;
  provider_name: string | null;
  status: string;
  linked_at: string;
  consent_expires_at: string | null;
  last_synced_at: string | null;
  revoked_at: string | null;
};

function budapestDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest' }).format(date);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);
  const user = userData.user;

  const body = await req.json().catch(() => ({})) as { action?: string; connection_id?: string };
  const mode = getMode();
  const custMode = customerMode(mode);

  const { data: customer } = await admin
    .from('saltedge_customers')
    .select('id, se_customer_id')
    .eq('user_id', user.id)
    .eq('mode', custMode)
    .maybeSingle();

  try {
    switch (body.action ?? 'status') {
      case 'status': {
        if (mode === 'off') return json({ enabled: false, mode });
        let connections: ConnectionRow[] = [];
        if (customer) {
          const { data } = await admin
            .from('saltedge_connections')
            .select('id, se_connection_id, provider_name, status, linked_at, consent_expires_at, last_synced_at, revoked_at')
            .eq('customer_id', customer.id)
            .is('revoked_at', null)
            .order('linked_at', { ascending: false });
          connections = (data ?? []) as ConnectionRow[];
        }
        const { data: recent } = await admin
          .from('saltedge_transactions')
          .select('id, made_on, amount, is_refund, points_awarded, points_status, venues:matched_venue_id(name)')
          .eq('user_id', user.id)
          .order('made_on', { ascending: false })
          .limit(20);
        return json({
          enabled: true,
          mode,
          connections: connections.map(({ se_connection_id: _hidden, ...rest }) => rest),
          recent: (recent ?? []).map((row: Record<string, unknown>) => ({
            id: row.id,
            made_on: row.made_on,
            amount_huf: row.amount,
            is_refund: row.is_refund,
            points: row.points_awarded ?? 0,
            points_status: row.points_status,
            venue_name: (row.venues as { name?: string } | null)?.name ?? 'Partnerhely',
          })),
        });
      }

      case 'connect': {
        if (mode === 'off') return json({ error: 'FEATURE_DISABLED' }, 403);

        if (mode === 'mock') {
          let customerId = customer?.id as string | undefined;
          if (!customerId) {
            const { data, error } = await admin
              .from('saltedge_customers')
              .insert({ user_id: user.id, se_customer_id: `mock-${crypto.randomUUID()}`, status: 'active', mode: 'mock' })
              .select('id')
              .single();
            if (error) throw error;
            customerId = data.id;
          }
          const expires = new Date(Date.now() + CONSENT_PERIOD_DAYS * 86_400_000).toISOString();
          const { error } = await admin.from('saltedge_connections').insert({
            se_connection_id: `mock-${crypto.randomUUID()}`,
            customer_id: customerId,
            provider_name: 'Tesztbank (mock)',
            provider_code: 'mock',
            status: 'active',
            consent_expires_at: expires,
          });
          if (error) throw error;
          return json({ connected: true, mock: true });
        }

        const client = SaltEdgeClient.fromEnv();
        let seCustomerId = customer?.se_customer_id as string | undefined;
        if (!seCustomerId) {
          if (!user.email) return json({ error: 'EMAIL_REQUIRED' }, 400);
          const lead = await client.createLead(user.email, user.id);
          seCustomerId = lead.data.customer_id;
          const { error } = await admin
            .from('saltedge_customers')
            .insert({ user_id: user.id, se_customer_id: seCustomerId, status: 'active', mode: custMode });
          if (error) throw error;
        }
        // Only spend from today onwards is relevant; older history is never requested.
        const session = await client.createLeadSession(seCustomerId, budapestDate(), RETURN_TO);
        return json({ connect_url: session.data.redirect_url, expires_at: session.data.expires_at });
      }

      case 'disconnect': {
        if (!customer || !body.connection_id) return json({ error: 'NOT_FOUND' }, 404);
        const { data: connection } = await admin
          .from('saltedge_connections')
          .select('id, se_connection_id')
          .eq('id', body.connection_id)
          .eq('customer_id', customer.id)
          .maybeSingle();
        if (!connection) return json({ error: 'NOT_FOUND' }, 404);
        if (mode === 'sandbox' || mode === 'live') {
          await SaltEdgeClient.fromEnv().deleteConnection(connection.se_connection_id);
        }
        const now = new Date().toISOString();
        const { error } = await admin
          .from('saltedge_connections')
          .update({ status: 'revoked', revoked_at: now, updated_at: now })
          .eq('id', connection.id);
        if (error) throw error;
        return json({ disconnected: true });
      }

      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (error) {
    console.error('[saltedge-connect]', error);
    return json({ error: 'SALTEDGE_ERROR' }, 502);
  }
});
