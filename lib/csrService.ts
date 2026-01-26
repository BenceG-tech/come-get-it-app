import { Platform } from 'react-native';
import { getSupabase } from '@/lib/supabaseClient';
import { CSRImpactResponse } from '@/types/csr';

const CSR_API_URL = 'https://nrxfiblssxwzeziomlvc.supabase.co/functions/v1/get-user-csr-impact';

export type CSRError = {
  code: 'UNAUTHORIZED' | 'SERVER_ERROR' | 'NETWORK_ERROR';
  message: string;
};

export type CSRImpactResult =
  | { success: true; data: CSRImpactResponse }
  | { success: false; error: CSRError };

export async function getUserCSRImpact(): Promise<CSRImpactResult> {
  console.log('[CSRService] Fetching user CSR impact...');

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

    const accessToken = sessionData.session.access_token;
    console.log('[CSRService] Making API request with token');

    const response = await fetch(CSR_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
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

    const data = await response.json() as CSRImpactResponse;
    console.log('[CSRService] Impact data received:', {
      total_impact_units: data.stats?.total_impact_units,
      recent_donations_count: data.recent_donations?.length,
    });

    return { success: true, data };
  } catch (error) {
    console.error('[CSRService] Network error:', error);
    const isWeb = Platform.OS === 'web';
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
