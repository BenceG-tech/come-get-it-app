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
  participates_in_points?: boolean | null;
  points_per_visit?: number | null;
  opening_hours?: OpeningHours | null;
  distance?: number | null; // in meters
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
  open: string;
  close: string;
  closed?: boolean;
};

export type VenueDrink = {
  id: string;
  venueId: string;
  drinkName: string;
  imageUrl?: string | null;
  isFreeDrink?: boolean | null;
  isCover?: boolean | null;
};

export type FreeDrinkWindow = {
  id: string;
  venueId: string;
  drinkId: string;
  dayOfWeek: number; // 0-6 (Mon-Sun) or DB convention
  start: string; // HH:mm
  end: string; // HH:mm
};

export type VenueWithDetails = Venue & {
  images?: string[];
  drinks?: VenueDrink[];
  freeDrinkWindows?: FreeDrinkWindow[];
};