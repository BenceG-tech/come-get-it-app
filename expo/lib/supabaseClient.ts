import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

const projectRef = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split('.')[0] || 'come-get-it';
  } catch {
    return 'come-get-it';
  }
})();

export const SUPABASE_AUTH_STORAGE_KEY = `sb-${projectRef}-auth-token`;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('[SupabaseClient] Missing env vars', {
    hasUrl: Boolean(SUPABASE_URL),
    hasAnon: Boolean(SUPABASE_ANON),
  });
}

type RawStorage = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

/** Közvetlen tároló-hozzáférés (a storage adapter megkerülésével, hogy az elő-ellenőrzés ne hívja önmagát). */
const rawStorage: RawStorage =
  Platform.OS === 'web'
    ? {
        read: async (key) => {
          try {
            return globalThis?.localStorage?.getItem(key) ?? null;
          } catch (e) {
            console.warn('[SupabaseClient] localStorage read failed', e);
            return null;
          }
        },
        write: async (key, value) => {
          try {
            globalThis?.localStorage?.setItem(key, value);
          } catch (e) {
            console.warn('[SupabaseClient] localStorage write failed', e);
          }
        },
        remove: async (key) => {
          try {
            globalThis?.localStorage?.removeItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] localStorage remove failed', e);
          }
        },
      }
    : {
        read: async (key) => {
          try {
            return await AsyncStorage.getItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage read failed', e);
            return null;
          }
        },
        write: async (key, value) => {
          try {
            await AsyncStorage.setItem(key, value);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage write failed', e);
          }
        },
        remove: async (key) => {
          try {
            await AsyncStorage.removeItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage remove failed', e);
          }
        },
      };

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/** 60 mp ráhagyás: ha a token hamarosan lejár, azt már a kliens kezeli. */
const EXPIRY_GRACE_MS = 60_000;

type PersistedAuthState = {
  expires_at?: unknown;
  refresh_token?: unknown;
  user?: unknown;
};

/**
 * Elő-ellenőrzés: mielőtt a Supabase kliens hozzányúlna a tárolt munkamenethez,
 * lejárt token esetén magunk frissítjük. Ha a refresh tokent a szerver már nem
 * ismeri (visszavont munkamenet / törölt fiók), töröljük a tárolt állapotot — így
 * a kliens belső auto-refreshje soha nem fut bele az "Invalid Refresh Token"
 * AuthApiError-ba, és az app tiszta bejelentkező képernyővel indul.
 */
async function preflightPersistedSession(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return;

  const raw = await rawStorage.read(SUPABASE_AUTH_STORAGE_KEY);
  if (!raw) return;

  let stored: PersistedAuthState | null = null;
  try {
    stored = JSON.parse(raw) as PersistedAuthState;
  } catch {
    await rawStorage.remove(SUPABASE_AUTH_STORAGE_KEY);
    return;
  }

  const refreshToken =
    typeof stored?.refresh_token === 'string' ? stored.refresh_token : '';
  if (!refreshToken) {
    await rawStorage.remove(SUPABASE_AUTH_STORAGE_KEY);
    return;
  }

  const expiresAtMs =
    typeof stored?.expires_at === 'number' ? stored.expires_at * 1000 : Infinity;
  // Még élő token: hagyjuk a kliensre (ő időben frissít, felesleges hívást nem folytatunk).
  if (expiresAtMs > Date.now() + EXPIRY_GRACE_MS) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );

    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      if (
        typeof data?.access_token === 'string' &&
        typeof data?.refresh_token === 'string'
      ) {
        // Ha a válaszban nincs user, visszaillesztjük a tároltból (a kliens validációhoz kell).
        if (!data.user && stored?.user) data.user = stored.user;
        // Ha közben valaki (kijelentkezés) törölte a sessiont, ne élesszük újra.
        if ((await rawStorage.read(SUPABASE_AUTH_STORAGE_KEY)) === null) return;
        await rawStorage.write(SUPABASE_AUTH_STORAGE_KEY, JSON.stringify(data));
        console.log('[SupabaseClient] preflight refresh ok');
      }
      return;
    }

    const bodyText = await response.text();
    let errorCode = '';
    try {
      errorCode = String(
        (JSON.parse(bodyText) as { error_code?: unknown })?.error_code ?? '',
      ).toLowerCase();
    } catch {
      // nem JSON válasz — a bodyText alapján döntünk
    }
    const lowered = bodyText.toLowerCase();
    const isDeadToken =
      errorCode.includes('refresh_token_not_found') ||
      errorCode.includes('invalid_refresh_token') ||
      lowered.includes('invalid refresh token') ||
      lowered.includes('refresh token not found');

    if (isDeadToken) {
      console.warn(
        '[SupabaseClient] preflight: refresh token revoked — clearing persisted session',
      );
      await rawStorage.remove(SUPABASE_AUTH_STORAGE_KEY);
      return;
    }

    // Átmeneti hiba (429/5xx): megtartjuk a sessiont, a kliens majd újrapróbálja.
    console.warn('[SupabaseClient] preflight refresh rejected', {
      status: response.status,
    });
  } catch (e) {
    // Hálózati hiba: hagyjuk a sessiont, a kliens normal módban kezeli.
    console.warn('[SupabaseClient] preflight refresh failed (network)', e);
  }
}

let preflightPromise: Promise<void> | null = null;

const ensurePreflight = (): Promise<void> => {
  preflightPromise ??= preflightPersistedSession().catch((e) => {
    console.warn('[SupabaseClient] preflight crashed', e);
  });
  return preflightPromise;
};

const storage: StorageAdapter =
  Platform.OS === 'web'
    ? {
        getItem: async (key: string) => {
          try {
            if (key === SUPABASE_AUTH_STORAGE_KEY) await ensurePreflight();
            return globalThis?.localStorage?.getItem(key) ?? null;
          } catch (e) {
            console.warn('[SupabaseClient] localStorage getItem failed', e);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            globalThis?.localStorage?.setItem(key, value);
          } catch (e) {
            console.warn('[SupabaseClient] localStorage setItem failed', e);
          }
        },
        removeItem: async (key: string) => {
          try {
            globalThis?.localStorage?.removeItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] localStorage removeItem failed', e);
          }
        },
      }
    : {
        getItem: async (key: string) => {
          try {
            if (key === SUPABASE_AUTH_STORAGE_KEY) await ensurePreflight();
            return await AsyncStorage.getItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage getItem failed', e);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await AsyncStorage.setItem(key, value);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage setItem failed', e);
          }
        },
        removeItem: async (key: string) => {
          try {
            await AsyncStorage.removeItem(key);
          } catch (e) {
            console.warn('[SupabaseClient] AsyncStorage removeItem failed', e);
          }
        },
      };

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('Hiányzó Supabase env változó(k): EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  console.log('[SupabaseClient] Creating supabase client', {
    hasUrl: Boolean(SUPABASE_URL),
    hasAnon: Boolean(SUPABASE_ANON),
  });
  client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      // PKCE flow: a Google OAuth után a code csak így cserélhető session-re
      flowType: 'pkce',
      storage,
      storageKey: SUPABASE_AUTH_STORAGE_KEY,
    },
  });

  return client;
}

/** Eltávolítja a sérült vagy már visszavont helyi munkamenetet. */
export async function clearPersistedSupabaseSession(): Promise<void> {
  await storage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
}
