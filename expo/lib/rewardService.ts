import { getSupabase } from '@/lib/supabaseClient';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export type RewardRedemptionResult = {
  redemption_id: string;
  reward_name: string;
  points_spent: number;
  new_balance: number;
  redemption_code: string;
};

function friendlyRewardError(code: string): string {
  if (code === 'INSUFFICIENT_POINTS') return 'Nincs elég pontod ehhez a jutalomhoz.';
  if (code === 'REWARD_NOT_FOUND') return 'A jutalom már nem található.';
  if (code === 'REWARD_INACTIVE') return 'Ez a jutalom jelenleg nem váltható be.';
  if (code === 'REWARD_EXPIRED') return 'A jutalom érvényessége lejárt.';
  if (code === 'REWARD_LIMIT_REACHED') return 'Ez a jutalom elfogyott.';
  return 'A jutalom beváltása most nem sikerült. Próbáld újra.';
}

export async function redeemReward(rewardId: string): Promise<RewardRedemptionResult> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('Jelentkezz be a jutalom beváltásához.');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/redeem-reward`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reward_id: rewardId }),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || payload.success !== true) {
    throw new Error(friendlyRewardError(typeof payload.error === 'string' ? payload.error : ''));
  }

  return payload as unknown as RewardRedemptionResult;
}
