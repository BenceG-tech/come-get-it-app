export type RewardCategory = 'drink' | 'food' | 'vip' | 'discount' | 'experience' | 'partner';

export interface Reward {
  id: string;
  venue_id: string;
  name: string;
  description?: string;
  points_required: number;
  valid_until: string; // "2026-12-31"
  active: boolean;
  image_url?: string;
  category?: RewardCategory;
  is_global?: boolean;
  partner_id?: string;
  partner_name?: string;
  priority?: number;
  terms_conditions?: string;
  max_redemptions?: number;
  current_redemptions?: number;
}