import type { Reward } from '@/types/reward';

function budapestToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function getAvailableRewards(rewards: Reward[]): Reward[] {
  const today = budapestToday();

  return rewards
    .filter((reward) => {
      if (!reward || reward.active === false) return false;
      return !reward.valid_until || reward.valid_until >= today;
    })
    .sort((a, b) => {
      const priorityDifference = (b.priority ?? 0) - (a.priority ?? 0);
      if (priorityDifference !== 0) return priorityDifference;
      return a.points_required - b.points_required;
    });
}
