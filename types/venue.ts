export type Offer = {
  title: string;
  description: string;
  points?: number;
};

export type FreeDrink = {
  name: string;
  description: string;
  image: string;
  ingredients: string;
};

export type Location = {
  city: string;
  distance?: string;
};

export type Venue = {
  id: string;
  name: string;
  description: string;
  image: string;
  address: string;
  latitude: number;
  longitude: number;
  tags: string[];
  category: string;
  isOpen: boolean;
  phone?: string;
  website?: string;
  offers: Offer[];
  priceLevel?: string;
  location: Location;
  freeDrink: FreeDrink;
};