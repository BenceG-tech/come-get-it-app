export type CSRStats = {
  total_donations_huf: number;
  total_impact_units: number;
  total_redemptions: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_donation_date: string | null;
  global_rank: number | null;
  city_rank: number | null;
};

export type RecentDonation = {
  date: string;
  amount: number;
  impact_description: string;
  charity_name: string;
  venue_name: string;
};

export type NextMilestone = {
  target_units: number;
  current_units: number;
  remaining_units: number;
  description: string;
};

export type LeaderboardPosition = {
  rank: number;
  total_users: number;
  percentile: number;
};

export type CSRImpactResponse = {
  stats: CSRStats;
  recent_donations: RecentDonation[];
  next_milestone: NextMilestone | null;
  leaderboard_position: LeaderboardPosition | null;
};

export type CharityImpact = {
  donation_huf: number;
  impact_description: string;
  charity_name: string;
};
