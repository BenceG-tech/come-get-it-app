import { EdgeRequestError, postAuthenticatedFunction } from '@/lib/edgeRequest';

export type RewardRedemptionResult = {
  redemption_id: string;
  reward_name: string;
  points_spent: number;
  new_balance: number;
  redemption_code: string | null;
  already_redeemed?: boolean;
  redeemed_at?: string;
};

function friendlyRewardError(code: string): string {
  if (code === 'REDEMPTION_STATUS_UNAVAILABLE') return 'A korábbi beváltás állapotát most nem tudjuk ellenőrizni. Próbáld meg később.';
  if (code === 'INSUFFICIENT_POINTS') return 'Nincs elég pontod ehhez a jutalomhoz.';
  if (code === 'REWARD_NOT_FOUND') return 'A jutalom már nem található.';
  if (code === 'REWARD_INACTIVE') return 'Ez a jutalom jelenleg nem váltható be.';
  if (code === 'REWARD_VENUE_INACTIVE') return 'A jutalom partnerhelye jelenleg nem elérhető.';
  if (code === 'REWARD_EXPIRED') return 'A jutalom érvényessége lejárt.';
  if (code === 'REWARD_LIMIT_REACHED') return 'Ez a jutalom elfogyott.';
  if (code === 'REWARD_ALREADY_REDEEMED') return 'Ezt a jutalmat már beváltottad.';
  if (code === 'UNAUTHORIZED' || code === 'Unauthorized') return 'Jelentkezz be újra a jutalom beváltásához.';
  if (code === 'INVALID_REWARD_ID') return 'A jutalom azonosítója érvénytelen. Nyisd meg újra a jutalmat.';
  return 'A jutalom beváltása most nem sikerült. Próbáld újra.';
}

export async function redeemReward(rewardId: string, userId: string): Promise<RewardRedemptionResult> {
  try {
    const payload = await postAuthenticatedFunction('redeem-reward', { reward_id: rewardId }, 12_000, userId);
    if (payload.success !== true || typeof payload.new_balance !== 'number' ||
        !(typeof payload.redemption_code === 'string' || (payload.already_redeemed === true && payload.redemption_code === null)) || typeof payload.redemption_id !== 'string') {
      throw new Error('A beváltás eredménye nem igazolható. Frissítsd a pontegyenlegedet.');
    }
    return payload as unknown as RewardRedemptionResult;
  } catch (error) {
    if (error instanceof EdgeRequestError) {
      if (error.status === 0) throw error;
      throw new Error(friendlyRewardError(error.status === 401 ? 'UNAUTHORIZED' : error.code));
    }
    throw error;
  }
}

/** Explicit read-only action; cannot create a redemption or deduct points. */
export async function getRewardRedemption(rewardId: string, userId: string): Promise<RewardRedemptionResult | null> {
  const payload = await postAuthenticatedFunction('redeem-reward', { reward_id: rewardId, action: 'status' }, 12_000, userId);
  if (payload.success !== true || !('redemption' in payload)) throw new Error('A korábbi beváltás állapota nem ellenőrizhető.');
  if (payload.redemption === null) return null;
  const result = payload.redemption as RewardRedemptionResult;
  if (!result || typeof result.redemption_id !== 'string' || typeof result.new_balance !== 'number')
    throw new Error('A korábbi beváltás adatai hiányosak.');
  return result;
}
