import { getSupabase } from '@/lib/supabaseClient';
import { rest } from '@/lib/supabaseRest';
import type { Venue } from '@/types/venue';

type FetchVenuesOptions = {
  columns?: string;
  limit?: number;
  offset?: number;
  orderByCreated?: boolean;
};

type VenueImageRow = {
  url?: string | null;
  image_url?: string | null;
  is_cover?: boolean | null;
  created_at?: string | null;
};

function logError(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function normalizeVenue(venue: Venue): Venue {
  if (venue.opening_hours && typeof venue.opening_hours === 'string') {
    try {
      return { ...venue, opening_hours: JSON.parse(venue.opening_hours) } as Venue;
    } catch (error) {
      console.warn('[VenueService] Failed to parse opening_hours', { venueId: venue.id, error: logError(error) });
      return { ...venue, opening_hours: null };
    }
  }

  return venue;
}

function buildVenuesRestPath(options: FetchVenuesOptions): string {
  const params: string[] = [`select=${encodeURIComponent(options.columns ?? '*')}`];

  if (options.limit !== undefined) params.push(`limit=${options.limit}`);
  if (options.offset !== undefined) params.push(`offset=${options.offset}`);
  if (options.orderByCreated ?? true) params.push('order=created_at.desc');

  return `/venues?${params.join('&')}`;
}

/**
 * Loads venues with the authenticated Supabase client first, then falls back to REST.
 * This keeps the venue list working when RLS allows authenticated reads but blocks anon REST reads.
 */
export async function fetchVenues(options: FetchVenuesOptions = {}): Promise<Venue[]> {
  const columns = options.columns ?? '*';

  try {
    const supabase = getSupabase();
    let query = supabase.from('venues').select(columns);

    if (options.orderByCreated ?? true) {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }

    if (options.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = Array.isArray(data) ? (data as unknown as Venue[]) : [];
    console.log('[VenueService] Venues loaded via Supabase client', { count: rows.length });
    return rows.map(normalizeVenue);
  } catch (error) {
    console.warn('[VenueService] Supabase client venue fetch failed, falling back to REST', logError(error));
  }

  const response = await rest(buildVenuesRestPath(options));
  const json = (await response.json()) as unknown;
  const rows = Array.isArray(json) ? (json as Venue[]) : [];
  console.log('[VenueService] Venues loaded via REST fallback', { count: rows.length });
  return rows.map(normalizeVenue);
}

export async function fetchVenueCoverUrl(venueId: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('venue_images')
      .select('url,image_url,is_cover,created_at')
      .eq('venue_id', venueId)
      .order('is_cover', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) throw error;

    const first = Array.isArray(data) ? (data[0] as VenueImageRow | undefined) : undefined;
    const imageUrl = first?.url ?? first?.image_url ?? null;
    if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) return imageUrl.trim();
  } catch (error) {
    console.warn('[VenueService] Supabase client cover image fetch failed, falling back to REST', {
      venueId,
      error: logError(error),
    });
  }

  try {
    const imagesResponse = await rest(
      `/venue_images?venue_id=eq.${encodeURIComponent(venueId)}&select=url,image_url,is_cover&order=is_cover.desc,created_at.asc&limit=1`
    );
    const images = (await imagesResponse.json()) as unknown;

    if (Array.isArray(images) && images.length > 0) {
      const first = images[0] as VenueImageRow;
      const imageUrl = first?.url ?? first?.image_url ?? null;
      if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) return imageUrl.trim();
    }
  } catch (error) {
    console.warn('[VenueService] REST cover image fetch failed', { venueId, error: logError(error) });
  }

  return null;
}
