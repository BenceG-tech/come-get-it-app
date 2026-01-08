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
  tags?: string[];
  latitude?: number | null;
  longitude?: number | null;
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
} | {
  closed: true;
  open?: never;
  close?: never;
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
  dayOfWeek?: number; // Legacy: 0-6 (Mon-Sun) or DB convention
  days?: number[]; // ISO 8601: 1=Monday...7=Sunday
  start: string; // HH or HH:mm
  end: string; // HH or HH:mm
  timezone?: string; // e.g. "Europe/Budapest"
};

export type RedemptionToken = {
  token: string;
  token_id: string;
  expires_at: string; // ISO timestamp
  qr_payload: string; // e.g. "cgi://redeem?t=<token>&v=<venue_id>"
};

export type RedemptionError = {
  error: string;
  code: 'NOT_ELIGIBLE' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'UNKNOWN';
  next_available_window?: {
    day: number; // ISO 1-7
    start: string;
    end: string;
  };
  cooldown_until?: string; // ISO timestamp
};

export type VenueWithDetails = Venue & {
  images?: string[];
  drinks?: VenueDrink[];
  freeDrinkWindows?: FreeDrinkWindow[];
};