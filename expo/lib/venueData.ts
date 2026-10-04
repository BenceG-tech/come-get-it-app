import { getSupabase } from '@/lib/supabaseClient';
import type { FreeDrinkData, FreeDrinkWindow, Venue, VenueDrink } from '@/types/venue';

export const VENUE_DRINK_COLUMNS = 'id,venue_id,drink_name,image_url,is_free_drink,description';
export const FREE_DRINK_WINDOW_COLUMNS = 'id,venue_id,drink_id,days,start_time,end_time,timezone';
type DrinkRow = { id: string; venue_id: string; drink_name: string; image_url?: string | null; is_free_drink?: boolean | null; description?: string | null };
type WindowRow = { id: string; venue_id: string; drink_id: string | null; days?: number[] | null; start_time: string; end_time: string; timezone?: string | null };

export const UNKNOWN_DRINK_DATA: FreeDrinkData = { status: 'unknown', drinks: [], windows: [] };

/** Deadline also covers an auth lock. Abort cancels the actual PostgREST request when it has started. */
export async function readVenueData<T>(label: string, query: (signal: AbortSignal) => PromiseLike<{ data: T | null; error: { message: string } | null }>, signal?: AbortSignal): Promise<T | null> {
  if (signal?.aborted) throw new Error(`${label}: megszakított kérés`);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAborted: (error: Error) => void = () => {};
  const abort = () => { controller.abort(); rejectAborted(new Error(`${label}: megszakított kérés`)); };
  const deadline = new Promise<never>((_, reject) => {
    rejectAborted = reject;
    timer = setTimeout(() => { controller.abort(); reject(new Error(`${label}: a kiszolgáló nem válaszolt időben`)); }, 8_000);
  });
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const result = await Promise.race([Promise.resolve(query(controller.signal)), deadline]);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

const venueCache = new Map<string, { venue: Venue; at: number }>();
export function rememberVenues(venues: Venue[]) {
  for (const venue of venues) venueCache.set(String(venue.id), { venue, at: Date.now() });
  while (venueCache.size > 250) venueCache.delete(venueCache.keys().next().value!);
}
export function getCachedVenue(id: string): Venue | null {
  const cached = venueCache.get(id);
  return cached && Date.now() - cached.at < 60_000 ? cached.venue : null;
}

export function normalizeVenue(venue: Venue): Venue {
  let openingHours = venue.opening_hours;
  if (typeof openingHours === 'string') {
    try { openingHours = JSON.parse(openingHours); } catch { openingHours = null; }
  }
  return { ...venue, opening_hours: openingHours, price_level: venue.price_level ?? venue.price_tier };
}

/** Two paginated queries per batch, never one detail request per venue. A partial query is unknown. */
export async function fetchFreeDrinkData(venueIds: string[], signal?: AbortSignal): Promise<Map<string, FreeDrinkData>> {
  const result = new Map<string, FreeDrinkData>();
  const ids = [...new Set(venueIds)];
  const supabase = getSupabase();
  for (let start = 0; start < ids.length; start += 100) {
    const batch = ids.slice(start, start + 100);
    const loadRows = async <T,>(table: string, columns: string): Promise<T[]> => {
      const rows: T[] = [];
      for (let offset = 0; ; offset += 500) {
        const page = await readVenueData<unknown[]>('Ajánlatok betöltése', (requestSignal) => supabase.from(table).select(columns).in('venue_id', batch).order('id').range(offset, offset + 499).abortSignal(requestSignal), signal);
        if (!Array.isArray(page)) throw new Error('Hiányzó ajánlatadat');
        rows.push(...page as T[]);
        if (page.length < 500) return rows;
      }
    };
    try {
      const [drinks, windows] = await Promise.all([loadRows<DrinkRow>('venue_drinks', VENUE_DRINK_COLUMNS), loadRows<WindowRow>('free_drink_windows', FREE_DRINK_WINDOW_COLUMNS)]);
      for (const id of batch) result.set(id, { status: 'ready', drinks: [], windows: [] });
      for (const row of drinks) {
        const drink: VenueDrink = { id: String(row.id), venueId: String(row.venue_id), drinkName: row.drink_name, imageUrl: row.image_url, isFreeDrink: row.is_free_drink === true, description: row.description };
        result.get(drink.venueId)?.drinks.push(drink);
      }
      for (const row of windows) {
        const window: FreeDrinkWindow = { id: String(row.id), venueId: String(row.venue_id), drinkId: row.drink_id ?? '', days: row.days ?? [], start: row.start_time, end: row.end_time, timezone: row.timezone ?? undefined };
        result.get(window.venueId)?.windows.push(window);
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      console.warn('[VenueData] Offer availability unavailable');
      for (const id of batch) result.set(id, UNKNOWN_DRINK_DATA);
    }
  }
  return result;
}
