import { RedemptionToken, RedemptionError, FreeDrinkWindow } from '@/types/venue';
import { getSupabase } from '@/lib/supabaseClient';

const REDEMPTION_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export type IssueTokenRequest = {
  venue_id: string;
  drink_id: string;
  user_id: string;
  device_fingerprint: string;
};

export type IssueTokenResponse = 
  | { success: true; data: RedemptionToken }
  | { success: false; error: RedemptionError };

export type RedemptionWindow = RedemptionToken & {
  expires_in_seconds: number;
  venue?: {
    id: string;
    name: string;
  };
  drink?: {
    id: string;
    name: string;
  } | null;
  demo_mode?: boolean;
};

export type CreateRedemptionWindowRequest = {
  venue_id: string;
  drink_id?: string | null;
  user_latitude?: number | null;
  user_longitude?: number | null;
  demo_mode?: boolean;
};

export type CreateRedemptionWindowResponse =
  | { success: true; data: RedemptionWindow }
  | { success: false; error: RedemptionError };

export type ConfirmRedemptionResponse =
  | {
      success: true;
      data: {
        redemption_id?: string | null;
        impact_delta: number;
        impact_message: string;
        total_impact_units?: number | null;
      };
    }
  | { success: false; error: RedemptionError };

function getDeviceFingerprint(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).replace(/[^a-zA-Z0-9-]/g, '').substring(2, 16);
  return `device-${timestamp}-${random}`;
}

function getTodayISODay(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getCurrentHour(): number {
  return new Date().getHours();
}

function dbDayToISO(dbDay: number): number {
  // Database stores 0-6 (Monday=0, Sunday=6); ISO 8601 uses 1-7.
  return dbDay + 1;
}

function normalizeTimeHour(value: string | undefined): number {
  const raw = (value ?? '').toString();
  const hour = Number.parseInt(raw.split(':')[0] ?? '', 10);
  return Number.isFinite(hour) ? hour : -1;
}

function mapRedemptionError(status: number, payload: Record<string, unknown>): RedemptionError {
  const rawMessage = payload.message ?? payload.error;
  const errorMessage = typeof rawMessage === 'string' && rawMessage.trim().length > 0
    ? rawMessage
    : 'Ismeretlen hiba történt.';

  if (status === 400) {
    return { error: errorMessage, code: 'BAD_REQUEST' };
  }

  if (status === 401) {
    return { error: 'Jelentkezz be a beváltáshoz.', code: 'UNAUTHORIZED' };
  }

  if (status === 403) {
    return {
      error: errorMessage || 'Nem vagy jogosult az ingyen italra most.',
      code: 'NOT_ELIGIBLE',
      next_available_window: payload.next_available_window as RedemptionError['next_available_window'],
    };
  }

  if (status === 408 || status === 410) {
    return { error: errorMessage || 'A beváltási ablak lejárt.', code: 'EXPIRED' };
  }

  if (status === 429) {
    return {
      error: errorMessage || 'Túl sok kérés. Kérjük, várj egy kicsit.',
      code: 'RATE_LIMITED',
      cooldown_until: typeof payload.cooldown_until === 'string' ? payload.cooldown_until : undefined,
    };
  }

  return { error: errorMessage, code: 'UNKNOWN' };
}

async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[RedemptionService] Could not read auth session', { message: error.message });
      return null;
    }
    return data.session?.access_token ?? null;
  } catch (error) {
    console.warn('[RedemptionService] Supabase session unavailable', error);
    return null;
  }
}

async function postRedemptionFunction<TPayload extends Record<string, unknown>, TResponse extends Record<string, unknown>>(
  functionName: string,
  payload: TPayload,
  requiresUserToken: boolean
): Promise<{ ok: true; data: TResponse } | { ok: false; error: RedemptionError }> {
  if (!REDEMPTION_BASE_URL) {
    return { ok: false, error: { error: 'Hiányzó Supabase konfiguráció.', code: 'NETWORK_ERROR' } };
  }

  const accessToken = await getAccessToken();
  if (requiresUserToken && !accessToken) {
    return { ok: false, error: { error: 'Jelentkezz be a beváltáshoz.', code: 'UNAUTHORIZED' } };
  }

  try {
    const response = await fetch(`${REDEMPTION_BASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${accessToken ?? SUPABASE_ANON}`,
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = await response.json().catch(() => ({})) as Record<string, unknown>;

    if (!response.ok) {
      console.error('[RedemptionService] Edge function error', {
        functionName,
        status: response.status,
        payload: responsePayload,
      });
      return { ok: false, error: mapRedemptionError(response.status, responsePayload) };
    }

    return { ok: true, data: responsePayload as TResponse };
  } catch (error) {
    console.error('[RedemptionService] Edge function network error', { functionName, error });
    return {
      ok: false,
      error: {
        error: 'Hálózati hiba. Ellenőrizd az internetkapcsolatod.',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

export function isCurrentlyInWindow(window: FreeDrinkWindow): boolean {
  const todayISO = getTodayISODay();
  const currentHour = getCurrentHour();
  
  let windowDaysISO: number[] = [];
  if (window.days && window.days.length > 0) {
    windowDaysISO = window.days;
  } else if (window.dayOfWeek !== undefined) {
    windowDaysISO = [dbDayToISO(window.dayOfWeek)];
  }
  
  if (!windowDaysISO.includes(todayISO)) {
    return false;
  }
  
  const startHour = normalizeTimeHour(window.start);
  const endHour = normalizeTimeHour(window.end);
  if (startHour < 0 || endHour < 0) return false;
  
  return currentHour >= startHour && currentHour < endHour;
}

export function findNextAvailableWindow(
  windows: FreeDrinkWindow[],
  drinkId: string
): { day: number; start: string; end: string } | null {
  const drinkWindows = windows.filter(w => w.drinkId === drinkId);
  if (drinkWindows.length === 0) return null;
  
  const todayISO = getTodayISODay();
  const currentHour = getCurrentHour();
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDayISO = ((todayISO - 1 + dayOffset) % 7) + 1;
    
    for (const window of drinkWindows) {
      let windowDaysISO: number[] = [];
      if (window.days && window.days.length > 0) {
        windowDaysISO = window.days;
      } else if (window.dayOfWeek !== undefined) {
        windowDaysISO = [dbDayToISO(window.dayOfWeek)];
      }
      
      if (windowDaysISO.includes(checkDayISO)) {
        const startHour = normalizeTimeHour(window.start);
        if (startHour < 0) continue;
        
        if (dayOffset === 0 && currentHour >= startHour) {
          continue;
        }
        
        return {
          day: checkDayISO,
          start: window.start,
          end: window.end,
        };
      }
    }
  }
  
  return null;
}

/** True when a drink has no configured time windows — redeemable anytime. */
export function isDrinkAlwaysAvailable(windows: FreeDrinkWindow[], drinkId: string): boolean {
  return windows.filter(w => String(w.drinkId) === String(drinkId)).length === 0;
}

export function checkLocalEligibility(
  windows: FreeDrinkWindow[],
  drinkId: string
): { eligible: boolean; alwaysAvailable?: boolean; nextWindow?: { day: number; start: string; end: string } } {
  const drinkWindows = windows.filter(w => String(w.drinkId) === String(drinkId));

  if (drinkWindows.length === 0) {
    return { eligible: true, alwaysAvailable: true };
  }

  for (const window of drinkWindows) {
    if (isCurrentlyInWindow(window)) {
      return { eligible: true };
    }
  }
  
  const nextWindow = findNextAvailableWindow(windows, drinkId);
  return { eligible: false, nextWindow: nextWindow ?? undefined };
}

export async function createRedemptionWindow(
  request: CreateRedemptionWindowRequest
): Promise<CreateRedemptionWindowResponse> {
  const result = await postRedemptionFunction<CreateRedemptionWindowRequest & Record<string, unknown>, Record<string, unknown>>(
    'create-redemption-window',
    request,
    true
  );

  if (!result.ok) return { success: false, error: result.error };

  const data = result.data;
  const token = typeof data.token === 'string' ? data.token : '';
  const tokenId = typeof data.token_id === 'string' ? data.token_id : token;
  const expiresAt = typeof data.expires_at === 'string'
    ? data.expires_at
    : new Date(Date.now() + 120 * 1000).toISOString();
  const qrPayload = typeof data.qr_payload === 'string'
    ? data.qr_payload
    : `cgi://redeem?t=${encodeURIComponent(token)}&v=${encodeURIComponent(request.venue_id)}`;

  if (!token) {
    return { success: false, error: { error: 'A beváltási ablak nem adott vissza tokent.', code: 'UNKNOWN' } };
  }

  return {
    success: true,
    data: {
      token,
      token_id: tokenId,
      expires_at: expiresAt,
      qr_payload: qrPayload,
      expires_in_seconds: typeof data.expires_in_seconds === 'number' ? data.expires_in_seconds : 120,
      venue: data.venue as RedemptionWindow['venue'],
      drink: data.drink as RedemptionWindow['drink'],
      demo_mode: data.demo_mode === true,
    },
  };
}

export async function confirmRedemption(token: string): Promise<ConfirmRedemptionResponse> {
  const result = await postRedemptionFunction<{ token: string }, Record<string, unknown>>(
    'confirm-redemption',
    { token },
    true
  );

  if (!result.ok) return { success: false, error: result.error };

  const data = result.data;
  return {
    success: true,
    data: {
      redemption_id: typeof data.redemption_id === 'string' ? data.redemption_id : null,
      impact_delta: typeof data.impact_delta === 'number' ? data.impact_delta : 1,
      impact_message: typeof data.impact_message === 'string' ? data.impact_message : '+1 ember kap ma tiszta vizet',
      total_impact_units: typeof data.total_impact_units === 'number' ? data.total_impact_units : null,
    },
  };
}

export async function issueRedemptionToken(
  venueId: string,
  drinkId: string,
  userId: string
): Promise<IssueTokenResponse> {
  console.log('[RedemptionService] Issuing legacy QR token for venue:', venueId, 'drink:', drinkId);
  
  const deviceFingerprint = getDeviceFingerprint();
  
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${REDEMPTION_BASE_URL}/functions/v1/issue-redemption-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${accessToken ?? SUPABASE_ANON}`,
      },
      body: JSON.stringify({
        venue_id: venueId,
        drink_id: drinkId,
        user_id: userId,
        device_fingerprint: deviceFingerprint,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      console.error('[RedemptionService] Server error:', response.status, JSON.stringify(errorData));
      return { success: false, error: mapRedemptionError(response.status, errorData) };
    }
    
    const data = await response.json();
    console.log('[RedemptionService] Legacy QR token issued successfully:', data.token_id);
    
    return {
      success: true,
      data: {
        token: data.token,
        token_id: data.token_id,
        expires_at: data.expires_at,
        qr_payload: data.qr_payload,
      },
    };
  } catch (error) {
    console.error('[RedemptionService] Network error:', error);
    return {
      success: false,
      error: {
        error: 'Hálózati hiba. Ellenőrizd az internetkapcsolatod.',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

export function generateMockToken(venueId: string, drinkId: string): RedemptionToken {
  const token = `demo-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const tokenId = `tid-${Date.now()}`;
  const expiresAt = new Date(Date.now() + 120 * 1000).toISOString();
  const qrPayload = `cgi://redeem?t=${token}&v=${venueId}&d=${drinkId}`;
  
  return {
    token,
    token_id: tokenId,
    expires_at: expiresAt,
    qr_payload: qrPayload,
  };
}

export function generateMockRedemptionWindow(venueId: string, drinkId?: string | null): RedemptionWindow {
  const token = generateMockToken(venueId, drinkId ?? 'demo-drink');
  return {
    ...token,
    expires_in_seconds: 120,
    demo_mode: true,
  };
}

export function generateQRCodeUrl(payload: string, size: number = 300): string {
  const encodedPayload = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedPayload}&bgcolor=FFFFFF&color=000000&margin=10`;
}

export function getTimeRemainingMs(expiresAt: string): number {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, expiryTime - now);
}

export function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const DAY_LABELS_HU: { short: string; full: string }[] = [
  { short: 'H', full: 'Hétfő' },
  { short: 'K', full: 'Kedd' },
  { short: 'Sze', full: 'Szerda' },
  { short: 'Cs', full: 'Csütörtök' },
  { short: 'P', full: 'Péntek' },
  { short: 'Szo', full: 'Szombat' },
  { short: 'V', full: 'Vasárnap' },
];

export function getDayLabel(isoDay: number, format: 'short' | 'full' = 'full'): string {
  const index = isoDay - 1;
  if (index < 0 || index >= DAY_LABELS_HU.length) return '';
  return DAY_LABELS_HU[index][format];
}
