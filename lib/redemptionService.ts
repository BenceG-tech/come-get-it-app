import { RedemptionToken, RedemptionError, FreeDrinkWindow } from '@/types/venue';

const REDEMPTION_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export type IssueTokenRequest = {
  venue_id: string;
  drink_id: string;
  user_id: string;
  device_fingerprint: string;
};

export type IssueTokenResponse = 
  | { success: true; data: RedemptionToken }
  | { success: false; error: RedemptionError };

function getDeviceFingerprint(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `device_${timestamp}_${random}`;
}

function getTodayISODay(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getCurrentHour(): number {
  return new Date().getHours();
}

function dbDayToISO(dbDay: number): number {
  // Database stores 0-6 (Monday=0, Sunday=6)
  // ISO 8601 uses 1-7 (Monday=1, Sunday=7)
  return dbDay + 1;
}

export function isCurrentlyInWindow(window: FreeDrinkWindow): boolean {
  const todayISO = getTodayISODay();
  const currentHour = getCurrentHour();
  
  // Get days array - convert dayOfWeek (0-6) to ISO (1-7) if needed
  let windowDaysISO: number[] = [];
  if (window.days && window.days.length > 0) {
    // days array is already in ISO format (1-7)
    windowDaysISO = window.days;
  } else if (window.dayOfWeek !== undefined) {
    // dayOfWeek is in DB format (0-6), convert to ISO
    windowDaysISO = [dbDayToISO(window.dayOfWeek)];
  }
  
  console.log(`[RedemptionService] isCurrentlyInWindow: todayISO=${todayISO}, windowDaysISO=${JSON.stringify(windowDaysISO)}, dayOfWeek=${window.dayOfWeek}`);
  
  if (!windowDaysISO.includes(todayISO)) {
    return false;
  }
  
  const startHour = parseInt(window.start.split(':')[0], 10);
  const endHour = parseInt(window.end.split(':')[0], 10);
  
  console.log(`[RedemptionService] Time check: currentHour=${currentHour}, startHour=${startHour}, endHour=${endHour}`);
  
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
  
  console.log(`[RedemptionService] findNextAvailableWindow: drinkId=${drinkId}, todayISO=${todayISO}, drinkWindows=${drinkWindows.length}`);
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDayISO = ((todayISO - 1 + dayOffset) % 7) + 1;
    
    for (const window of drinkWindows) {
      // Get days in ISO format
      let windowDaysISO: number[] = [];
      if (window.days && window.days.length > 0) {
        windowDaysISO = window.days;
      } else if (window.dayOfWeek !== undefined) {
        windowDaysISO = [dbDayToISO(window.dayOfWeek)];
      }
      
      if (windowDaysISO.includes(checkDayISO)) {
        const startHour = parseInt(window.start.split(':')[0], 10);
        
        // Skip if it's today and we're past the start time
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

export function checkLocalEligibility(
  windows: FreeDrinkWindow[],
  drinkId: string
): { eligible: boolean; nextWindow?: { day: number; start: string; end: string } } {
  const drinkWindows = windows.filter(w => w.drinkId === drinkId);
  
  for (const window of drinkWindows) {
    if (isCurrentlyInWindow(window)) {
      return { eligible: true };
    }
  }
  
  const nextWindow = findNextAvailableWindow(windows, drinkId);
  return { eligible: false, nextWindow: nextWindow ?? undefined };
}

export async function issueRedemptionToken(
  venueId: string,
  drinkId: string,
  userId: string
): Promise<IssueTokenResponse> {
  console.log('[RedemptionService] Issuing token for venue:', venueId, 'drink:', drinkId);
  
  const deviceFingerprint = getDeviceFingerprint();
  
  try {
    const response = await fetch(`${REDEMPTION_BASE_URL}/functions/v1/issue-redemption-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venue_id: venueId,
        drink_id: drinkId,
        user_id: userId,
        device_fingerprint: deviceFingerprint,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RedemptionService] Server error:', response.status, errorData);
      
      if (response.status === 403) {
        return {
          success: false,
          error: {
            error: errorData.message || 'Nem vagy jogosult az ingyen italra most.',
            code: 'NOT_ELIGIBLE',
            next_available_window: errorData.next_available_window,
          },
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          error: {
            error: errorData.message || 'Túl sok kérés. Kérjük, várj egy kicsit.',
            code: 'RATE_LIMITED',
            cooldown_until: errorData.cooldown_until,
          },
        };
      }
      
      return {
        success: false,
        error: {
          error: errorData.message || 'Ismeretlen hiba történt.',
          code: 'UNKNOWN',
        },
      };
    }
    
    const data = await response.json();
    console.log('[RedemptionService] Token issued successfully:', data.token_id);
    
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
  const token = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const tokenId = `tid_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 120 * 1000).toISOString();
  const qrPayload = `cgi://redeem?t=${token}&v=${venueId}&d=${drinkId}`;
  
  return {
    token,
    token_id: tokenId,
    expires_at: expiresAt,
    qr_payload: qrPayload,
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
