export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

function ensureLeadingSlash(p: string) {
  return p.startsWith('/') ? p : `/${p}`;
}

async function doFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[SupabaseREST] ${res.status} ${res.statusText} – ${text}`);
  }
  return res;
}

export async function rest(path: string, init: RequestInit = {}) {
  const headers = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    Accept: 'application/json',
    'Accept-Profile': 'public',
    ...(init.headers || {}),
  } as Record<string, string>;

  const normalized = ensureLeadingSlash(path);
  const base = `${SUPABASE_URL}/rest/v1`;
  const url = `${base}${normalized}`;

  console.info('[SupabaseMobile] REST', url);

  try {
    return await doFetch(url, { ...init, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);

    const retryMap: Array<{ match: RegExp; replace: (s: string) => string }> = [
      { match: /^\/venues(\b|\?)/, replace: (s) => s.replace(/^\/venues/, '/venue') },
      { match: /^\/rewards(\b|\?)/, replace: (s) => s.replace(/^\/rewards/, '/reward') },
      { match: /^\/free_drink_windows(\b|\?)/, replace: (s) => s.replace(/^\/free_drink_windows/, '/free_drink_windows_public') },
    ];

    if (msg.includes('PGRST125') || msg.includes('Invalid path')) {
      for (const r of retryMap) {
        if (r.match.test(normalized)) {
          const altPath = r.replace(normalized);
          const altUrl = `${base}${altPath}`;
          console.warn('[SupabaseMobile] 404 path, retrying with', altUrl);
          try {
            return await doFetch(altUrl, { ...init, headers });
          } catch (e2) {
            console.error('[SupabaseMobile] Retry failed', e2);
            throw e2;
          }
        }
      }
    }

    console.error('[SupabaseMobile] REST error', msg);
    throw e as Error;
  }
}
