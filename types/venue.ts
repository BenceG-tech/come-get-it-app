export type Venue = {
  id: string;
  name: string;
  address: string;
  description?: string | null;
  phone_number?: string | null;
  website_url?: string | null;
  image_url?: string | null;
  hero_image_url?: string | null;
  plan?: 'basic' | 'standard' | 'premium';
  is_paused?: boolean;
  created_at?: string;
  // New fields for admin control
  participates_in_points?: boolean | null;
  points_per_visit?: number | null;
  opening_hours?: OpeningHours | null;
  google_maps_url?: string | null;
  distance?: number | null; // in meters
  category?: string | null;
  price_tier?: number | null;
  rating?: number | null;
};

export type OpeningHours = {
  monday?: DayHours | null;
  tuesday?: DayHours | null;
  wednesday?: DayHours | null;
  thursday?: DayHours | null;
  friday?: DayHours | null;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
};

export type DayHours = {
  open: string; // "09:00"
  close: string; // "23:00"
  closed?: boolean;
};