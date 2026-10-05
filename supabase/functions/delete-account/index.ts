import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceRole);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;
  if (userError || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: dependency, error: dependencyError } = await admin.rpc('account_deletion_dependencies', { target_user_id: user.id });
  if (dependencyError) return json({ error: 'Account dependency check failed' }, 500);
  if (dependency) {
    // Repeated requests reuse the original request and its timestamp.
    const { error: requestError } = await admin.from('account_deletion_requests').upsert({
      user_id: user.id, reason: dependency,
    }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (requestError) return json({ error: 'Could not save deletion request' }, 500);
    const { data: request, error: readError } = await admin.from('account_deletion_requests')
      .select('id').eq('user_id', user.id).single();
    if (readError || !request) return json({ error: 'Could not confirm deletion request' }, 500);
    return json({ success: false, status: 'pending', code: 'ACCOUNT_DELETION_REQUESTED', request_id: request.id });
  }

  // The database trigger is part of this single Auth deletion transaction.
  // Do not delete profiles or personal rows in independent HTTP requests.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account] Auth deletion failed', { code: deleteError.code });
    return json({ error: 'Account deletion failed' }, 500);
  }
  const usesApple = user.identities?.some(identity => identity.provider === 'apple')
    || user.app_metadata?.providers?.includes('apple');
  // Social sign-in is disabled in this release and there are currently no Apple
  // identities. Never report a successful Apple revocation without evidence.
  return json({ success: true, apple_revocation: usesApple ? 'manual_required' : 'not_applicable' });
});
