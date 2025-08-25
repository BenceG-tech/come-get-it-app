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
};