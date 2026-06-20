import { Platform } from 'react-native';
import { getSupabase } from '@/lib/supabaseClient';
import { CSRImpactResponse } from '@/types/csr';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const CSR_API_URL = `${SUPABASE_URL}/functions/v1/get-user-csr-impact`;

export type CSRError = {
  code: 'UNAUTHORIZED' | 'SERVER_ERROR' | 'NETWORK_ERROR';
  message: string;
};

export type CSRImpactResult =
  | { success: true; data: CSRImpactResponse }
  | { success: false; error: CSRError };

function normalizeCSRImpact(raw: unknown): CSRImpactResponse {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const statsRaw = (payload.stats ?? {}) as Record<string, unknown>;

  const flatDonationCount = typeof payload.donation_count === 'number' ? payload.donation_count : 0;
  const flatDonationHuf = typeof payload.total_donations_huf === 'number' ? payload.total_donations_huf : 0;
  const totalImpactUnits = typeof statsRaw.total_impact_units === 'number'
    ? statsRaw.total_impact_units
    : flatDonationCount;
  const totalDonationsHuf = typeof statsRaw.total_donations_huf === 'number'
    ? statsRaw.total_donations_huf
    : flatDonationHuf;

  return {
    stats: {
      total_donations_huf: totalDonationsHuf,
      total_impact_units: totalImpactUnits,
      total_redemptions: typeof statsRaw.total_redemptions === 'number' ? statsRaw.total_redemptions : flatDonationCount,
      current_streak_days: typeof statsRaw.current_streak_days === 'number' ? statsRaw.current_streak_days : 0,
      longest_streak_days: typeof statsRaw.longest_streak_days === 'number' ? statsRaw.longest_streak_days : 0,
      last_donation_date: typeof statsRaw.last_donation_date === 'string' ? statsRaw.last_donation_date : null,
      global_rank: typeof statsRaw.global_rank === 'number' ? statsRaw.global_rank : null,
      city_rank: typeof statsRaw.city_rank === 'number' ? statsRaw.city_rank : null,
    },
    recent_donations: Array.isArray(payload.recent_donations) ? payload.recent_donations as CSRImpactResponse['recent_donations'] : [],
    next_milestone: (payload.next_milestone ?? null) as CSRImpactResponse['next_milestone'],
    leaderboard_position: (payload.leaderboard_position ?? null) as CSRImpactResponse['leaderboard_position'],
  };
}

export async function getUserCSRImpact(): Promise<CSRImpactResult> {
  console.log('[CSRService] Fetching user CSR impact...');

  // Check platform first - web will have CORS issues with edge functions
  if ((Platform.OS as string) === 'web') {
    console.log('[CSRService] Web platform detected - edge function not available due to CORS');
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'A hatás adatok csak a mobil alkalmazásban érhetők el. Kérjük, használd az Expo Go appot!',
      },
    };
  }

  try {
    const supabase = getSupabase();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session) {
      console.log('[CSRService] No session found', { sessionError });
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Jelentkezz be a hatásod megtekintéséhez',
        },
      };
    }

    if (!CSR_API_URL || !SUPABASE_ANON) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Hiányzó Supabase konfiguráció.',
        },
      };
    }

    const accessToken = sessionData.session.access_token;
    console.log('[CSRService] Making API request with token');

    const response = await fetch(CSR_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
      },
    });

    console.log('[CSRService] Response status:', response.status);

    if (response.status === 401) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Jelentkezz be a hatásod megtekintéséhez',
        },
      };
    }

    if (response.status >= 500) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'A hatás adatok átmenetileg nem elérhetők. Próbáld újra később!',
        },
      };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[CSRService] Unexpected error:', response.status, errorText);
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'A hatás adatok átmenetileg nem elérhetők. Próbáld újra később!',
        },
      };
    }

    const raw = await response.json();
    const data = normalizeCSRImpact(raw);
    console.log('[CSRService] Impact data received:', {
      total_impact_units: data.stats?.total_impact_units,
      recent_donations_count: data.recent_donations?.length,
    });

    return { success: true, data };
  } catch (error) {
    console.error('[CSRService] Network error:', error);
    const isWeb = (Platform.OS as string) === 'web';
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: isWeb 
          ? 'A hatás adatok csak a mobil alkalmazásban érhetők el. Kérjük, használd az Expo Go appot!'
          : 'A hatás adatok átmenetileg nem elérhetők. Próbáld újra később!',
      },
    };
  }
}
