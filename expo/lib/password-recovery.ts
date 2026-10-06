import type { SupabaseClient } from '@supabase/supabase-js';

const INVALID_LINK = 'A jelszó-visszaállító link érvénytelen vagy lejárt. Kérj új linket a bejelentkezési oldalon.';

/** Only consume callbacks addressed to this app's password-reset route. Never log the URL. */
export async function completePasswordRecovery(auth: SupabaseClient['auth'], callbackUrl: string): Promise<void> {
  let url: URL;
  try { url = new URL(callbackUrl); } catch { throw new Error(INVALID_LINK); }
  const route = `${url.hostname}${url.pathname}`.replace(/^\/+|\/+$/g, '');
  if (url.protocol !== 'comegetit:' || route !== 'reset-password') throw new Error(INVALID_LINK);
  const params = new URLSearchParams(url.search);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const value = (name: string) => params.get(name) ?? fragment.get(name);
  if (value('error') || value('error_code')) throw new Error(INVALID_LINK);
  const code = value('code');
  const accessToken = value('access_token');
  const refreshToken = value('refresh_token');
  if (!code && !(accessToken && refreshToken)) throw new Error(INVALID_LINK);
  const result = code
    ? await auth.exchangeCodeForSession(code)
    : await auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! });
  if (result.error || !result.data.session) throw new Error(INVALID_LINK);
}
