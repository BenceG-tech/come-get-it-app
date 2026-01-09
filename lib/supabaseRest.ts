const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : `/${p}`;
}

export async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  console.log('[SupabaseMobile] rest called, URL:', SUPABASE_URL ? 'set' : 'missing');
  
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn('[SupabaseMobile] Missing Supabase credentials');
    return {
      ok: false,
      status: 400,
      json: async () => [],
      text: async () => '[]',
    } as Response;
  }

  const headers = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    Prefer: 'return=representation',
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  } as Record<string, string>;

  const normalized = ensureLeadingSlash(path);
  const url = `${SUPABASE_URL}/rest/v1${normalized}`;
  console.log('[SupabaseMobile] Fetching:', url);

  const res = await fetch(url, { ...init, headers });
  console.log('[SupabaseMobile] Response status:', res.status);
  
  return res;
}
