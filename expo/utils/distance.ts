import type { Venue } from '@/types/venue';

export type LatLng = { latitude: number; longitude: number };

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Precise venue coordinate from `coordinates` (Venue Hub) or legacy latitude/longitude; null when unknown. */
export function venueLatLng(venue: Pick<Venue, 'coordinates' | 'latitude' | 'longitude'>): LatLng | null {
  const latRaw = venue.coordinates?.lat ?? venue.latitude;
  const lngRaw = venue.coordinates?.lng ?? venue.longitude;
  const latitude = typeof latRaw === 'string' ? Number(latRaw) : latRaw;
  const longitude = typeof lngRaw === 'string' ? Number(lngRaw) : lngRaw;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) return null;
  return { latitude, longitude };
}

/**
 * Adds `distance` (meters) and sorts nearest first. Venues without coordinates keep their
 * original order at the end. Without a user position the list is returned unchanged.
 */
export function sortByDistance<T extends Pick<Venue, 'coordinates' | 'latitude' | 'longitude' | 'distance'>>(
  venues: T[],
  user: LatLng | null | undefined,
): T[] {
  if (!user) return venues;
  return venues
    .map((venue, index) => {
      const coord = venueLatLng(venue);
      const distance = coord ? haversineMeters(user.latitude, user.longitude, coord.latitude, coord.longitude) : null;
      return { venue: { ...venue, distance }, index };
    })
    .sort((a, b) => {
      const da = a.venue.distance ?? Infinity;
      const db = b.venue.distance ?? Infinity;
      return da === db ? a.index - b.index : da - db;
    })
    .map((item) => item.venue);
}
