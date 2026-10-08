import type { SupabaseClient } from '@supabase/supabase-js';

const INVALID_LINK = 'A megerősítő link érvénytelen vagy lejárt. Kérj új megerősítő e-mailt, majd nyisd meg ezen a telefonon.';

/** Normal navigation is ignored. Never log callback URLs or provider errors. */
export async function completeEmailConfirmation(auth: SupabaseClient['auth'], callbackUrl: string): Promise<boolean> {
  let url: URL;
  try { url = new URL(callbackUrl); } catch { return false; }
  const route = `${url.hostname}${url.pathname}`.replace(/^\/+|\/+$/g, '');
  if (url.protocol !== 'comegetit:' || route !== 'auth') return false;
  const query = new URLSearchParams(url.search);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const value = (name: string) => query.get(name) ?? fragment.get(name);
  if (value('error') || value('error_code')) throw new Error(INVALID_LINK);
  const code = value('code');
  const accessToken = value('access_token');
  const refreshToken = value('refresh_token');
  if (!code && !accessToken && !refreshToken) return false;
  // Recovery callbacks belong exclusively to the password-reset screen.
  if (value('type') === 'recovery' || (!code && !(accessToken && refreshToken))) throw new Error(INVALID_LINK);
  try {
    const result = code
      ? await auth.exchangeCodeForSession(code)
      : await auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! });
    if (result.error || !result.data.session) throw new Error(INVALID_LINK);
    return true;
  } catch {
    throw new Error(INVALID_LINK);
  }
}
