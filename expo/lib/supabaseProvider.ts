import { rest } from '@/lib/supabaseRest';
import { getSupabase } from '@/lib/supabaseClient';
import { VENUE_PUBLIC_COLUMNS, Venue, VenueDrink, FreeDrinkWindow, VenueWithDetails } from '@/types/venue';
import { Reward } from '@/types/reward';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
const VENUE_IMAGE_COLUMNS = 'id,venue_id,url,label,is_cover';
const VENUE_DRINK_COLUMNS = 'id,venue_id,drink_name,image_url,is_free_drink,description';
const FREE_DRINK_WINDOW_COLUMNS = 'id,venue_id,drink_id,days,start_time,end_time,timezone';

async function invokeEdgeFunction<TResponse>(name: string, body: unknown): Promise<TResponse> {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  console.info('[Provider] invokeEdgeFunction', { name, url, body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      try {
        payload = await res.text();
      } catch {
        payload = null;
      }
    }

    console.error('[Provider] Edge function error', { name, status: res.status, payload });
    throw new Error(
      JSON.stringify({ name, status: res.status, statusText: res.statusText, payload }, null, 2)
    );
  }

  const json = (await res.json()) as TResponse;
  console.info('[Provider] Edge function ok', { name });
  return json;
}

function toYyyyMmDd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isUuidLike(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function fetchRewardsRest(params: { venueId?: string; scope: 'app' | 'venue' }): Promise<Reward[]> {
  const today = toYyyyMmDd(new Date());
  const base = `/rewards?select=*`;
  const active = `&active=eq.true`;
  const valid = `&valid_until=gte.${today}`;
  const order = `&order=${encodeURIComponent('priority.desc.nullslast,points_required.asc')}`;

  const venueId = params.venueId;
  const hasValidVenueId = isUuidLike(venueId);
  const globalOnly = params.scope === 'venue' && venueId && !hasValidVenueId;
  const venueOrGlobal = params.scope === 'venue' && hasValidVenueId
    ? `&or=${encodeURIComponent(`(venue_id.eq.${venueId},partner_id.eq.${venueId},is_global.eq.true)`)}`
    : '';
  const globalFilter = globalOnly ? '&is_global=eq.true' : '';

  const url = `${base}${active}${valid}${venueOrGlobal}${globalFilter}${order}`;
  console.info('[Provider] fetchRewardsRest', { scope: params.scope, venueId, url });

  const res = await rest(url);
  const json = (await res.json()) as unknown;
  const rewards = Array.isArray(json) ? (json as Reward[]) : [];
  console.info('[Provider] fetchRewardsRest result', { count: rewards.length });
  return rewards;
}

export async function fetchRewards(venueId: string): Promise<Reward[]> {
  const normalizedVenueId = String(venueId ?? '').trim();
  console.info('[Provider] fetchRewards', { venueId: normalizedVenueId });

  if (!isUuidLike(normalizedVenueId)) {
    console.warn('[Provider] fetchRewards received non-UUID venueId; using global rewards fallback', { venueId: normalizedVenueId });
    return fetchRewardsRest({ venueId: normalizedVenueId, scope: 'venue' });
  }

  try {
    const data = await invokeEdgeFunction<{ success?: boolean; rewards?: Reward[] }>('get-rewards', {
      venue_id: normalizedVenueId,
    });
    const rewards = Array.isArray(data?.rewards) ? data.rewards : [];
    console.info('[Provider] fetchRewards edge result', { count: rewards.length });
    if (rewards.length > 0) return rewards;
  } catch (e) {
    console.error('[Provider] fetchRewards edge failed, falling back to REST', e);
  }

  return fetchRewardsRest({ venueId: normalizedVenueId, scope: 'venue' });
}

export async function fetchAppRewards(): Promise<Reward[]> {
  console.info('[Provider] fetchAppRewards - using REST directly');
  // Edge function doesn't support scope:'global', use REST directly
  return fetchRewardsRest({ scope: 'app' });
}

export async function getVenueWithDetails(id: string): Promise<VenueWithDetails | null> {
  const normalizedId = decodeURIComponent(String(id)).trim();
  if (!normalizedId) return null;

  console.info('[Provider] getVenueWithDetails', normalizedId);

  type ImageRow = { id: string; venue_id: string; url?: string | null; label?: string | null; is_cover?: boolean | null };
  type DrinkRow = { id: string; venue_id: string; drink_name: string; image_url?: string | null; is_free_drink?: boolean | null; description?: string | null };
  type WindowRow = {
    id: string;
    venue_id: string;
    drink_id: string;
    day_of_week?: number | null;
    days?: number[] | null;
    start_time: string;
    end_time: string;
    timezone?: string | null;
  };

  let venueList: Venue[] = [];
  let imagesRows: ImageRow[] = [];
  let drinksRows: DrinkRow[] = [];
  let windowsRows: WindowRow[] = [];

  try {
    const supabase = getSupabase();
    const [{ data: venuesData, error: venueError }, imagesResult, drinksResult, windowsResult] = await Promise.all([
      supabase.from('venues').select(VENUE_PUBLIC_COLUMNS).eq('id', normalizedId).limit(1),
      (async () => {
        try {
          return await supabase.from('venue_images').select(VENUE_IMAGE_COLUMNS).eq('venue_id', normalizedId);
        } catch (error: unknown) {
          return { data: [], error };
        }
      })(),
      (async () => {
        try {
          return await supabase.from('venue_drinks').select(VENUE_DRINK_COLUMNS).eq('venue_id', normalizedId);
        } catch (error: unknown) {
          return { data: [], error };
        }
      })(),
      (async () => {
        try {
          return await supabase.from('free_drink_windows').select(FREE_DRINK_WINDOW_COLUMNS).eq('venue_id', normalizedId);
        } catch (error: unknown) {
          return { data: [], error };
        }
      })(),
    ]);

    if (venueError) throw venueError;

    venueList = Array.isArray(venuesData) ? (venuesData as unknown as Venue[]) : [];
    imagesRows = Array.isArray(imagesResult.data) ? (imagesResult.data as unknown as ImageRow[]) : [];
    drinksRows = Array.isArray(drinksResult.data) ? (drinksResult.data as unknown as DrinkRow[]) : [];
    windowsRows = Array.isArray(windowsResult.data) ? (windowsResult.data as unknown as WindowRow[]) : [];

    if (imagesResult.error) console.warn('[Provider] venue_images Supabase fetch failed', imagesResult.error);
    if (drinksResult.error) console.warn('[Provider] venue_drinks Supabase fetch failed', drinksResult.error);
    if (windowsResult.error) console.warn('[Provider] free_drink_windows Supabase fetch failed', windowsResult.error);
  } catch (supabaseError) {
    console.warn('[Provider] Supabase detail fetch failed, falling back to REST', supabaseError instanceof Error ? supabaseError.message : String(supabaseError));

    const encodedId = encodeURIComponent(normalizedId);
    const [venueRes, imagesRes, drinksRes, windowsRes] = await Promise.all([
      rest(`/venues?id=eq.${encodedId}&select=${encodeURIComponent(VENUE_PUBLIC_COLUMNS)}`),
      rest(`/venue_images?venue_id=eq.${encodedId}&select=${encodeURIComponent(VENUE_IMAGE_COLUMNS)}`).catch(() => new Response(JSON.stringify([]), { status: 200 })),
      rest(`/venue_drinks?venue_id=eq.${encodedId}&select=${encodeURIComponent(VENUE_DRINK_COLUMNS)}`).catch(() => new Response(JSON.stringify([]), { status: 200 })),
      rest(`/free_drink_windows?venue_id=eq.${encodedId}&select=${encodeURIComponent(FREE_DRINK_WINDOW_COLUMNS)}`).catch(() => new Response(JSON.stringify([]), { status: 200 })),
    ]);

    let responseText: string = '';
    try {
      responseText = await venueRes.text();
      console.info('[Provider] Raw venue response:', responseText.substring(0, 500));
      venueList = JSON.parse(responseText) as Venue[];
    } catch (parseError) {
      console.error('[Provider] Failed to parse venue response as JSON:', parseError);
      console.error('[Provider] Response text:', responseText.substring(0, 500));
      return null;
    }

    try {
      imagesRows = (await imagesRes.json()) as ImageRow[];
      drinksRows = (await drinksRes.json()) as DrinkRow[];
      windowsRows = (await windowsRes.json()) as WindowRow[];
    } catch (parseError) {
      console.error('[Provider] Failed to parse related data as JSON:', parseError);
      imagesRows = [];
      drinksRows = [];
      windowsRows = [];
    }
  }
  
  if (!Array.isArray(venueList) || venueList.length === 0) return null;
  let venue = venueList[0];

  if (venue.price_level == null && venue.price_tier != null) {
    venue = { ...venue, price_level: venue.price_tier };
  }
  
  if (venue.opening_hours && typeof venue.opening_hours === 'string') {
    try {
      venue.opening_hours = JSON.parse(venue.opening_hours);
      console.info('[Provider] Parsed opening_hours from string');
    } catch (e) {
      console.error('[Provider] Failed to parse opening_hours string:', e);
      venue.opening_hours = null;
    }
  }
  
  const drinks: VenueDrink[] = (drinksRows ?? []).map((d) => ({
    id: String(d.id),
    venueId: String(d.venue_id),
    drinkName: d.drink_name,
    imageUrl: d.image_url ?? null,
    isFreeDrink: d.is_free_drink ?? null,
    isCover: null,
    description: typeof d.description === 'string' && d.description.trim().length > 0 ? d.description.trim() : null,
  }));

  const windows: FreeDrinkWindow[] = (windowsRows ?? []).map((w) => ({
    id: String(w.id),
    venueId: String(w.venue_id),
    drinkId: String(w.drink_id),
    dayOfWeek: w.day_of_week === null || w.day_of_week === undefined ? undefined : Number(w.day_of_week),
    days: Array.isArray(w.days) ? w.days.map((d) => Number(d)).filter((d) => Number.isFinite(d)) : undefined,
    start: w.start_time,
    end: w.end_time,
    timezone: w.timezone ?? undefined,
  }));

  const urls = (imagesRows ?? [])
    .map((r) => ({
      url: (r.url ?? '') as string,
      isCover: Boolean(r.is_cover ?? false),
    }))
    .filter((r) => typeof r.url === 'string' && r.url.trim().length > 0 && r.url.trim().length <= 2000);

  const sorted = urls.sort((a, b) => Number(b.isCover) - Number(a.isCover));
  const seen = new Set<string>();
  const images = sorted
    .map((r) => r.url.trim())
    .filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });

  return { ...venue, images, drinks, freeDrinkWindows: windows };
}
