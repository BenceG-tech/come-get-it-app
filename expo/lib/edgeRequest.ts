import { getSupabase } from '@/lib/supabaseClient';
import { withDataTimeout } from '@/lib/supabaseRequest';

export class EdgeRequestError extends Error {
  constructor(message: string, public readonly code: string, public readonly status = 0,
    public readonly payload: Record<string, unknown> = {}) {
    super(message);
    this.name = 'EdgeRequestError';
  }
}

/** Bounded, authenticated mutation. Only a confirmed 401 is retried automatically. */
export async function postAuthenticatedFunction(
  name: string, body: Record<string, unknown>, timeoutMs = 12_000, expectedUserId?: string,
): Promise<Record<string, unknown>> {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) throw new EdgeRequestError('Hiányzó kiszolgáló-beállítás.', 'CONFIGURATION_ERROR');
  const supabase = getSupabase();
  const sessionResult = await withDataTimeout(supabase.auth.getSession(), 'Bejelentkezés ellenőrzése', 6_000);
  let session = sessionResult.data.session;
  if (sessionResult.error || !session) throw new EdgeRequestError('Jelentkezz be újra a beváltáshoz.', 'UNAUTHORIZED', 401);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0 || (session.expires_at != null && session.expires_at * 1000 < Date.now() + 30_000)) {
      const refreshed = await withDataTimeout(supabase.auth.refreshSession(), 'Bejelentkezés frissítése', 6_000);
      if (refreshed.error || !refreshed.data.session) throw new EdgeRequestError('Jelentkezz be újra a beváltáshoz.', 'UNAUTHORIZED', 401);
      session = refreshed.data.session;
    }
    if (expectedUserId && session.user.id !== expectedUserId)
      throw new EdgeRequestError('A bejelentkezett fiók megváltozott. Nyisd meg újra a képernyőt.', 'SESSION_CHANGED', 401);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });
      let payload: Record<string, unknown>;
      try { payload = await response.json() as Record<string, unknown>; }
      catch {
        if (controller.signal.aborted) throw new Error('Aborted response');
        throw new EdgeRequestError('A kiszolgáló válasza nem ellenőrizhető. Frissítsd az állapotot.', 'INVALID_RESPONSE', response.status);
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        throw new EdgeRequestError('A kiszolgáló válasza nem ellenőrizhető.', 'INVALID_RESPONSE', response.status);
      if (response.status === 401 && attempt === 0) continue;
      if (!response.ok) {
        const code = typeof payload.error === 'string' ? payload.error : typeof payload.code === 'string' ? payload.code : 'REQUEST_FAILED';
        throw new EdgeRequestError(code, code, response.status, payload);
      }
      return payload;
    } catch (error) {
      if (error instanceof EdgeRequestError) throw error;
      throw new EdgeRequestError(
        controller.signal.aborted
          ? 'A kiszolgáló nem válaszolt időben. A beváltás állapotát ellenőrizni kell.'
          : 'Megszakadt a kapcsolat. Ellenőrizd a beváltás állapotát, mielőtt újra próbálod.',
        controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
      );
    } finally { clearTimeout(timeout); }
  }
  throw new EdgeRequestError('Jelentkezz be újra a beváltáshoz.', 'UNAUTHORIZED', 401);
}
