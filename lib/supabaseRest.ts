const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : `/${p}`;
}

export async function rest(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn('[SupabaseMobile] Missing Supabase credentials, returning empty response');
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    Prefer: 'return=representation',
    ...(init.headers as Record<string, string> | undefined),
  } as Record<string, string>;

  const normalized = ensureLeadingSlash(path);
  const url = `${SUPABASE_URL}/rest/v1${normalized}`;
  console.info('[SupabaseMobile] REST', url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal });
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    if (fetchError?.name === 'AbortError') {
      console.warn('[SupabaseMobile] Request timeout, returning empty response');
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw fetchError;
  }
  clearTimeout(timeoutId);
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      try {
        body = await res.text();
      } catch {
        body = null;
      }
    }
    const err = new Error(
      JSON.stringify({ status: res.status, statusText: res.statusText, body }, null, 2)
    );
    throw err;
  }
  
  // Log response details for debugging
  console.info('[SupabaseMobile] Response status:', res.status);
  
  return res;
}
