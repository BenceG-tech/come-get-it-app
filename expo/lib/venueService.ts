import { getSupabase } from '@/lib/supabaseClient';
import { rest } from '@/lib/supabaseRest';
import { VENUE_PUBLIC_COLUMNS, type Venue } from '@/types/venue';
import { runSupabaseRead } from '@/lib/supabaseRequest';
import { fetchFreeDrinkData, normalizeVenue, readVenueData, rememberVenues, UNKNOWN_DRINK_DATA } from '@/lib/venueData';

type FetchVenuesOptions = {
  columns?: string;
  limit?: number;
  offset?: number;
  orderByCreated?: boolean;
  /** When true, paused/hidden venues are included (admin use only). Defaults to false. */
  includeHidden?: boolean;
  includeCovers?: boolean;
  signal?: AbortSignal;
  /** Publish the usable venue list before offer/image requests finish. */
  onBase?: (venues: Venue[]) => void;
};

/** Returns true when a venue is visible to app users (not hidden/paused in the admin panel). */
export function isVenueVisible(venue: Pick<Venue, 'is_paused'>): boolean {
  return venue.is_paused !== true;
}

type VenueImageRow = {
  url?: string | null;
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

/** Loads base data once, then enriches the whole list with batched offer and cover requests. */
export async function fetchVenues(options: FetchVenuesOptions = {}): Promise<Venue[]> {
  const columns = options.columns ?? VENUE_PUBLIC_COLUMNS;
  const includeHidden = options.includeHidden ?? false;
  const supabase = getSupabase();
  const data = await readVenueData<unknown[]>('Vendéglátóhelyek betöltése', (signal) => {
    let query = supabase.from('venues').select(columns);
    if (!includeHidden) query = query.or('is_paused.is.null,is_paused.eq.false');
    if (options.orderByCreated ?? true) query = query.order('created_at', { ascending: false });
    if (options.limit !== undefined) query = query.limit(options.limit);
    if (options.offset !== undefined) query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
    return query.abortSignal(signal);
  }, options.signal);
  if (!Array.isArray(data)) throw new Error('Nem érkezett helyszínlista.');
  const rows = (data as Venue[]).filter((venue) => includeHidden || isVenueVisible(venue))
    .map((venue) => ({ ...normalizeVenue(venue), freeDrinkData: UNKNOWN_DRINK_DATA }));
  rememberVenues(rows);
  if (!options.signal?.aborted) options.onBase?.(rows);
  const missingCovers = options.includeCovers === false ? [] : rows.filter((venue) => !venue.image_url && !venue.hero_image_url).map((venue) => venue.id);
  const coversPromise = fetchVenueCoverUrls(missingCovers, options.signal);
  const [offers, covers] = await Promise.all([fetchFreeDrinkData(rows.map((venue) => venue.id), options.signal), coversPromise]);
  if (options.signal?.aborted) throw new Error('Megszakított kérés');
  const enriched = rows.map((venue) => ({
    ...venue,
    image_url: venue.image_url || venue.hero_image_url || covers.get(venue.id) || null,
    freeDrinkData: offers.get(venue.id) ?? UNKNOWN_DRINK_DATA,
  }));
  rememberVenues(enriched);
  return enriched;
}

async function fetchVenueCoverUrls(ids: string[], signal?: AbortSignal): Promise<Map<string, string>> {
  const covers = new Map<string, string>();
  for (let start = 0; start < ids.length; start += 100) {
    try {
      const batch = ids.slice(start, start + 100);
      for (let offset = 0; ; offset += 500) {
        const data = await readVenueData<unknown[]>('Helyszínképek betöltése', (requestSignal) => getSupabase()
          .from('venue_images').select('venue_id,url,is_cover,created_at').in('venue_id', batch)
          .order('is_cover', { ascending: false }).order('created_at', { ascending: true }).order('id')
          .range(offset, offset + 499).abortSignal(requestSignal), signal);
        const rows = Array.isArray(data) ? data as (VenueImageRow & { venue_id: string })[] : [];
        for (const row of rows) if (!covers.has(row.venue_id) && row.url?.trim()) covers.set(row.venue_id, row.url.trim());
        if (rows.length < 500) break;
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      console.warn('[VenueService] Cover images unavailable');
    }
  }
  return covers;
}

export async function fetchVenueCoverUrl(venueId: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const data = await runSupabaseRead<unknown[]>(
      'Helyszín borítóképének betöltése',
      () => supabase
        .from('venue_images')
        .select('url,is_cover,created_at')
        .eq('venue_id', venueId)
        .order('is_cover', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1),
    );

    const first = Array.isArray(data) ? (data[0] as VenueImageRow | undefined) : undefined;
    const imageUrl = first?.url ?? null;
    if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) return imageUrl.trim();
  } catch (error) {
    console.warn('[VenueService] Supabase client cover image fetch failed, falling back to REST', {
      venueId,
      error: logError(error),
    });
  }

  try {
    const imagesResponse = await rest(
      `/venue_images?venue_id=eq.${encodeURIComponent(venueId)}&select=url,is_cover&order=is_cover.desc,created_at.asc&limit=1`
    );
    const images = (await imagesResponse.json()) as unknown;

    if (Array.isArray(images) && images.length > 0) {
      const first = images[0] as VenueImageRow;
      const imageUrl = first?.url ?? null;
      if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) return imageUrl.trim();
    }
  } catch (error) {
    console.warn('[VenueService] REST cover image fetch failed', { venueId, error: logError(error) });
  }

  return null;
}
