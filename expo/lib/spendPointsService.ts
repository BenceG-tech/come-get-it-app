import { getSupabase } from '@/lib/supabaseClient';
import { BANK_PREVIEW_ENABLED, isBankPreviewMode } from '@/lib/releaseFeatures';
import { withDataTimeout } from '@/lib/supabaseRequest';

export type SpendConnection = {
  id: string;
  provider_name: string | null;
  status: string;
  linked_at: string;
  consent_expires_at: string | null;
  last_synced_at: string | null;
};

export type SpendTransaction = {
  id: string;
  made_on: string;
  amount_huf: number;
  is_refund: boolean;
  points: number;
  points_status: string;
  venue_name: string;
};

export type SpendPointsStatus = {
  enabled: boolean;
  mode: 'off' | 'mock' | 'sandbox' | 'live';
  connections: SpendConnection[];
  recent: SpendTransaction[];
};

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await withDataTimeout(getSupabase().functions.invoke('saltedge-connect', { body }), 'Banki tesztfunkció');
  if (error) throw error;
  return data as T;
}

// Returns { enabled: false } whenever the feature is switched off or unreachable, so callers can hide it.
export async function getSpendPointsStatus(): Promise<SpendPointsStatus> {
  const disabled: SpendPointsStatus = { enabled: false, mode: 'off', connections: [], recent: [] };
  if (!BANK_PREVIEW_ENABLED) return disabled;
  try {
    const data = await invoke<Partial<SpendPointsStatus>>({ action: 'status' });
    if (data.enabled !== true || !isBankPreviewMode(data.mode)) return disabled;
    return {
      enabled: data.enabled === true,
      mode: data.mode ?? 'off',
      connections: data.connections ?? [],
      recent: data.recent ?? [],
    };
  } catch (error) {
    console.log('[SpendPoints] status unavailable', error);
    return { enabled: false, mode: 'off', connections: [], recent: [] };
  }
}

export async function startBankConnection(): Promise<{ connect_url?: string; connected?: boolean; mock?: boolean }> {
  if (!BANK_PREVIEW_ENABLED || !(await getSpendPointsStatus()).enabled) {
    throw new Error('A banki tesztfunkció ebben a kiadásban nem érhető el.');
  }
  return invoke({ action: 'connect' });
}

export async function disconnectBank(connectionId: string): Promise<void> {
  await invoke({ action: 'disconnect', connection_id: connectionId });
}

export type VenueCodeResult =
  | { success: true; venue_name: string }
  | { success: false; code: 'NOT_AUTHENTICATED' | 'INVALID_CODE' | 'ALREADY_CLASSIFIED' | 'TOO_LATE' | 'ERROR' };

export async function claimVenueCode(code: string): Promise<VenueCodeResult> {
  const { data, error } = await getSupabase().rpc('claim_venue_referral_code', { p_code: code });
  if (error) {
    console.log('[SpendPoints] claim_venue_referral_code failed', error.message);
    return { success: false, code: 'ERROR' };
  }
  return data as VenueCodeResult;
}
