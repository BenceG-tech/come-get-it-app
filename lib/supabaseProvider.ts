import { rest } from '@/lib/supabaseRest';
import { Venue, VenueDrink, FreeDrinkWindow, VenueWithDetails } from '@/types/venue';
import { Reward } from '@/types/reward';

function uuid(): string {
  try {
    const u = (globalThis as any)?.crypto?.randomUUID?.();
    if (typeof u === 'string') return u;
  } catch {}
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

async function invokeEdgeFunction<TResponse>(name: string, body: unknown): Promise<TResponse> {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  console.info('[Provider] invokeEdgeFunction', { name, url });

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

export async function fetchRewards(venueId: string): Promise<Reward[]> {
  console.info('[Provider] fetchRewards', { venueId });
  const data = await invokeEdgeFunction<{ success?: boolean; rewards?: Reward[] }>("get-rewards", {
    venue_id: venueId,
  });
  const rewards = Array.isArray(data?.rewards) ? data.rewards : [];
  console.info('[Provider] fetchRewards result', { count: rewards.length });
  return rewards;
}

export async function fetchAppRewards(): Promise<Reward[]> {
  console.info("[Provider] fetchAppRewards");
  try {
    const data = await invokeEdgeFunction<{ success?: boolean; rewards?: Reward[] }>("get-rewards", {
      venue_id: "global",
    });
    const rewards = Array.isArray(data?.rewards) ? data.rewards : [];
    console.info("[Provider] fetchAppRewards result", { count: rewards.length });
    return rewards;
  } catch (e) {
    console.error("[Provider] fetchAppRewards failed, fallback to fetchRewards(global)", e);
    return fetchRewards("global");
  }
}

export async function getVenueWithDetails(id: string): Promise<VenueWithDetails | null> {
  console.info('[Provider] getVenueWithDetails', id);
  const [venueRes, imagesRes, drinksRes, windowsRes] = await Promise.all([
    rest(`/venues?id=eq.${id}&select=*`),
    rest(`/venue_images?venue_id=eq.${id}&select=*`).catch(() => new Response(JSON.stringify([]), { status: 200 })),
    rest(`/venue_drinks?venue_id=eq.${id}&select=*`).catch(() => new Response(JSON.stringify([]), { status: 200 })),
    rest(`/free_drink_windows?venue_id=eq.${id}&select=*`).catch(() => new Response(JSON.stringify([]), { status: 200 })),
  ]);

  let venueList: Venue[];
  let responseText: string = '';
  try {
    responseText = await venueRes.text();
    console.info('[Provider] Raw venue response:', responseText.substring(0, 500));
    venueList = JSON.parse(responseText);
  } catch (parseError) {
    console.error('[Provider] Failed to parse venue response as JSON:', parseError);
    console.error('[Provider] Response text:', responseText.substring(0, 500));
    return null;
  }
  
  if (!Array.isArray(venueList) || venueList.length === 0) return null;
  let venue = venueList[0];
  
  if (venue.opening_hours && typeof venue.opening_hours === 'string') {
    try {
      venue.opening_hours = JSON.parse(venue.opening_hours);
      console.info('[Provider] Parsed opening_hours from string');
    } catch (e) {
      console.error('[Provider] Failed to parse opening_hours string:', e);
      venue.opening_hours = null;
    }
  }
  
  console.info('[Provider] Venue opening_hours from DB:', JSON.stringify(venue.opening_hours, null, 2));
  console.info('[Provider] Full venue object keys:', Object.keys(venue));
  console.info('[Provider] Venue object:', JSON.stringify(venue, null, 2));

  type ImageRow = { id: string; venue_id: string; image_url?: string | null; url?: string | null; label?: string | null; is_cover?: boolean | null };
  let imagesRows: ImageRow[];
  let drinksRows: { id: string; venue_id: string; drink_name: string; image_url?: string | null; is_free_drink?: boolean | null; is_cover?: boolean | null }[];
  let windowsRows: {
    id: string;
    venue_id: string;
    drink_id: string;
    day_of_week?: number | null;
    days?: number[] | null;
    start_time: string;
    end_time: string;
  }[];
  
  try {
    imagesRows = await imagesRes.json();
    drinksRows = await drinksRes.json();
    windowsRows = await windowsRes.json();
  } catch (parseError) {
    console.error('[Provider] Failed to parse related data as JSON:', parseError);
    imagesRows = [];
    drinksRows = [];
    windowsRows = [];
  }

  const drinks: VenueDrink[] = (drinksRows ?? []).map((d) => ({
    id: String(d.id),
    venueId: String(d.venue_id),
    drinkName: d.drink_name,
    imageUrl: d.image_url ?? null,
    isFreeDrink: d.is_free_drink ?? null,
    isCover: d.is_cover ?? null,
  }));

  const windows: FreeDrinkWindow[] = (windowsRows ?? []).map((w) => ({
    id: String(w.id),
    venueId: String(w.venue_id),
    drinkId: String(w.drink_id),
    dayOfWeek: w.day_of_week === null || w.day_of_week === undefined ? undefined : Number(w.day_of_week),
    days: Array.isArray(w.days) ? w.days.map((d) => Number(d)).filter((d) => Number.isFinite(d)) : undefined,
    start: w.start_time,
    end: w.end_time,
  }));

  const urls = (imagesRows ?? [])
    .map((r) => ({
      url: (r.image_url ?? r.url ?? '') as string,
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

export type VenueUpdateInput = Partial<Venue> & {
  drinks?: VenueDrink[];
  freeDrinkWindows?: FreeDrinkWindow[];
};

export async function updateVenueWithDetails(id: string, updates: VenueUpdateInput): Promise<VenueWithDetails> {
  console.info('[Provider] updateVenueWithDetails', id, JSON.stringify(Object.keys(updates)));

  if (updates && (updates.name || updates.address || updates.description || updates.image_url || updates.hero_image_url || updates.tags !== undefined)) {
    const res = await rest(`/venues?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await res.json();
  }

  // Build mapping from temp drink IDs to new UUIDs BEFORE processing
  const tempToNewDrinkId: Record<string, string> = {};
  
  if (updates.drinks) {
    const incoming = updates.drinks.map((d) => {
      const oldId = String(d.id);
      const newId = oldId.startsWith('drink-') ? uuid() : oldId;
      tempToNewDrinkId[oldId] = newId;
      
      return {
        id: newId,
        venue_id: id,
        drink_name: d.drinkName,
        image_url: d.imageUrl ?? null,
        is_free_drink: d.isFreeDrink ?? null,
        is_cover: d.isCover ?? null,
      };
    });
    
    console.log('[Provider] Temp to new drink ID mapping:', tempToNewDrinkId);

    const existingRes = await rest(`/venue_drinks?venue_id=eq.${id}&select=id`);
    const existing: { id: string }[] = await existingRes.json();
    const keepIds = new Set(incoming.map((i) => i.id));
    const toDelete = (existing || []).map((e) => String(e.id)).filter((eid) => !keepIds.has(eid));

    if (incoming.length > 0) {
      await rest('/venue_drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify(incoming),
      });
    }

    if (toDelete.length > 0) {
      for (const delId of toDelete) {
        await rest(`/venue_drinks?id=eq.${delId}`, { method: 'DELETE' });
      }
    }

    updates.drinks = incoming.map((i) => ({
      id: String(i.id),
      venueId: String(i.venue_id),
      drinkName: i.drink_name,
      imageUrl: i.image_url ?? null,
      isFreeDrink: i.is_free_drink ?? null,
      isCover: i.is_cover ?? null,
    }));
  }

  if (updates.freeDrinkWindows) {
    console.log('[Provider] Free drink windows to save:', updates.freeDrinkWindows.map(w => ({
      drinkId: w.drinkId,
      days: w.days,
      dayOfWeek: w.dayOfWeek,
      start: w.start,
      end: w.end
    })));
    console.log('[Provider] Using temp to new drink ID mapping:', tempToNewDrinkId);

    const incomingW = updates.freeDrinkWindows.map((w) => {
      // Use the mapping from temp IDs to new UUIDs
      const mappedDrinkId = tempToNewDrinkId[String(w.drinkId)] ?? String(w.drinkId);
      const dayOfWeek = w.dayOfWeek === undefined || w.dayOfWeek === null ? null : Number(w.dayOfWeek);
      const days = Array.isArray(w.days) ? w.days.map((d) => Number(d)).filter((d) => Number.isFinite(d)) : null;
      
      console.log(`[Provider] Mapping window: drinkId ${w.drinkId} -> ${mappedDrinkId}, dayOfWeek: ${dayOfWeek}, days: ${JSON.stringify(days)}`);
      
      return {
        id: w.id && !String(w.id).startsWith('window-') ? w.id : uuid(),
        venue_id: id,
        drink_id: mappedDrinkId,
        day_of_week: dayOfWeek,
        days: days,
        start_time: w.start,
        end_time: w.end,
      };
    });

    const existingWRes = await rest(`/free_drink_windows?venue_id=eq.${id}&select=id`);
    const existingW: { id: string }[] = await existingWRes.json();
    const keepWIds = new Set(incomingW.map((i) => i.id));
    const toDeleteW = (existingW || []).map((e) => String(e.id)).filter((eid) => !keepWIds.has(eid));

    if (incomingW.length > 0) {
      await rest('/free_drink_windows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify(incomingW),
      });
    }

    if (toDeleteW.length > 0) {
      for (const delId of toDeleteW) {
        await rest(`/free_drink_windows?id=eq.${delId}`, { method: 'DELETE' });
      }
    }
  }

  const refreshed = await getVenueWithDetails(id);
  if (!refreshed) throw new Error('Failed to refresh venue after update');
  return refreshed;
}
