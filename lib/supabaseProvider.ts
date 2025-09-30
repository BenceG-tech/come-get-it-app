import { rest } from '@/lib/supabaseRest';
import { Venue, VenueDrink, FreeDrinkWindow, VenueWithDetails } from '@/types/venue';

function uuid(): string {
  try {
    const u = (globalThis as any)?.crypto?.randomUUID?.();
    if (typeof u === 'string') return u;
  } catch {}
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
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
  try {
    venueList = await venueRes.json();
  } catch (parseError) {
    console.error('[Provider] Failed to parse venue response as JSON:', parseError);
    try {
      const responseText = await venueRes.clone().text();
      console.error('[Provider] Response text:', responseText.substring(0, 500));
    } catch (textError) {
      console.error('[Provider] Could not get response text:', textError);
    }
    return null;
  }
  
  if (!Array.isArray(venueList) || venueList.length === 0) return null;
  let venue = venueList[0];
  
  // Parse opening_hours if it's a string
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

  let imagesRows: { id: string; venue_id: string; image_url: string }[];
  let drinksRows: { id: string; venue_id: string; drink_name: string; image_url?: string | null; is_free_drink?: boolean | null; is_cover?: boolean | null }[];
  let windowsRows: { id: string; venue_id: string; drink_id: string; day_of_week: number; start_time: string; end_time: string }[];
  
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
    dayOfWeek: Number(w.day_of_week),
    start: w.start_time,
    end: w.end_time,
  }));

  const images = (imagesRows ?? []).map((r) => r.image_url).filter(Boolean);

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

  if (updates.drinks) {
    const incoming = updates.drinks.map((d) => ({
      id: d.id && !String(d.id).startsWith('drink-') ? d.id : uuid(),
      venue_id: id,
      drink_name: d.drinkName,
      image_url: d.imageUrl ?? null,
      is_free_drink: d.isFreeDrink ?? null,
      is_cover: d.isCover ?? null,
    }));

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

    // Re-map for windows linking
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
    const drinks = updates.drinks ?? [];
    const idByTemp: Record<string, string> = {};
    drinks.forEach((d) => { idByTemp[String(d.id)] = String(d.id); });

    const incomingW = updates.freeDrinkWindows.map((w) => ({
      id: w.id && !String(w.id).startsWith('window-') ? w.id : uuid(),
      venue_id: id,
      drink_id: idByTemp[String(w.drinkId)] ?? String(w.drinkId),
      day_of_week: Number(w.dayOfWeek),
      start_time: w.start,
      end_time: w.end,
    }));

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
