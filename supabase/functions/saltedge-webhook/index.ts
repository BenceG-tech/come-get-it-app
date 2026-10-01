// Salt Edge Partners API callbacks.
// Auth: verify_jwt = false; every request must carry a valid Salt Edge RSA signature.
//
// Configure these four callback URLs in the Salt Edge dashboard (SALTEDGE_CALLBACK_URL is the base):
//   <base>/success  - a fetch finished: pull new transactions, match venues, award points
//   <base>/fail     - the bank login or fetch failed
//   <base>/notify   - progress only
//   <base>/destroy  - the user or the bank removed the connection
// Salt Edge callbacks never carry transactions themselves; they are fetched through the API.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  CONSENT_PERIOD_DAYS,
  SaltEdgeClient,
  corsHeaders,
  customerMode,
  getMode,
  json,
  syncConnection,
  verifyCallbackSignature,
} from '../_shared/saltedge.ts';

type CallbackPayload = {
  data?: {
    connection_id?: string;
    customer_id?: string;
    stage?: string;
    error_class?: string;
    error_message?: string;
  };
};

const CALLBACK_TYPES = ['success', 'fail', 'notify', 'destroy'] as const;
type CallbackType = typeof CALLBACK_TYPES[number];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const type = new URL(req.url).pathname.split('/').filter(Boolean).pop() as CallbackType;
  if (!CALLBACK_TYPES.includes(type)) return json({ error: 'Unknown callback type' }, 404);

  const rawBody = await req.text();
  const signature = req.headers.get('Signature');
  const base = Deno.env.get('SALTEDGE_CALLBACK_URL');
  if (!signature || !base) return json({ error: 'Missing signature' }, 401);
  if (!(await verifyCallbackSignature(`${base.replace(/\/$/, '')}/${type}`, rawBody, signature))) {
    return json({ error: 'Invalid signature' }, 401);
  }

  const mode = getMode();
  // Mock never talks to Salt Edge; off ignores callbacks without asking Salt Edge to retry.
  if (mode === 'off' || mode === 'mock') return json({ ignored: true, mode });

  const payload = JSON.parse(rawBody) as CallbackPayload;
  const seConnectionId = payload.data?.connection_id;
  const seCustomerId = payload.data?.customer_id;
  if (!seConnectionId) return json({ ok: true });

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const now = new Date().toISOString();

  try {
    if (type === 'notify') return json({ ok: true });

    if (type === 'destroy') {
      await admin
        .from('saltedge_connections')
        .update({ status: 'revoked', revoked_at: now, updated_at: now })
        .eq('se_connection_id', seConnectionId);
      return json({ ok: true });
    }

    if (type === 'fail') {
      await admin
        .from('saltedge_connections')
        .update({ last_error: `${payload.data?.error_class ?? 'Error'}: ${payload.data?.error_message ?? ''}`, updated_at: now })
        .eq('se_connection_id', seConnectionId);
      return json({ ok: true });
    }

    // success
    const { data: customer } = await admin
      .from('saltedge_customers')
      .select('id, user_id')
      .eq('se_customer_id', seCustomerId ?? '')
      .eq('mode', customerMode(mode))
      .maybeSingle();
    if (!customer) {
      console.warn('[saltedge-webhook] unknown customer', seCustomerId);
      return json({ ok: true, ignored: 'unknown_customer' });
    }

    const client = SaltEdgeClient.fromEnv();
    let { data: connection } = await admin
      .from('saltedge_connections')
      .select('id, se_connection_id, revoked_at')
      .eq('se_connection_id', seConnectionId)
      .maybeSingle();

    if (!connection) {
      const remote = await client.listConnections(seCustomerId!);
      const info = remote.data?.find((c) => c.id === seConnectionId);
      const { data: inserted, error } = await admin
        .from('saltedge_connections')
        .insert({
          se_connection_id: seConnectionId,
          customer_id: customer.id,
          provider_name: info?.provider_name ?? null,
          provider_code: info?.provider_code ?? null,
          status: 'active',
          consent_expires_at: new Date(Date.now() + CONSENT_PERIOD_DAYS * 86_400_000).toISOString(),
        })
        .select('id, se_connection_id, revoked_at')
        .single();
      if (error) throw error;
      connection = inserted;
    }

    if (connection.revoked_at) return json({ ok: true, ignored: 'revoked' });

    const stats = await syncConnection(admin, client, {
      id: connection.id,
      se_connection_id: connection.se_connection_id,
      user_id: customer.user_id,
    });
    console.log('[saltedge-webhook] synced', connection.id, stats);
    return json({ ok: true, stats });
  } catch (error) {
    console.error('[saltedge-webhook]', error);
    await admin
      .from('saltedge_connections')
      .update({ last_error: String((error as Error)?.message ?? error).slice(0, 500), updated_at: now })
      .eq('se_connection_id', seConnectionId);
    // A 5xx makes Salt Edge retry the callback.
    return json({ error: 'Processing failed' }, 500);
  }
});
