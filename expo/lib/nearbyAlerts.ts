// "Ingyen ital a közelben" értesítés: ha a felhasználó egy partnerhely 500 méteres körzetébe ér,
// és ott éppen beváltható ingyen ital, helyi értesítést kap.
//
// - Csak iOS, csak kifejezett bekapcsolás után (Profil → Közeli ingyen ital), értesítés és „Mindig”
//   helyengedéllyel. A hely a készüléken marad: semmit nem küldünk a szerverre.
// - iOS régiófigyelést használ (alacsony fogyasztás). Egy app legfeljebb 20 régiót figyelhet, ezért a
//   19 legközelebbi helyet figyeljük, plusz egy 2 km-es „horgony” régiót a felhasználó körül; ha abból
//   kilép, újraszámoljuk a legközelebbi helyeket.
// - Korlátok: helyenként naponta egyszer, összesen napi 2 értesítés, nem jön, ha aznap már beváltott,
//   ha a hely zárva van, vagy ha nincs éppen aktív ingyen ital idősáv.
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { fetchVenues } from '@/lib/venueService';
import { getOfferAvailability } from '@/lib/offerAvailability';
import { withDataTimeout } from '@/lib/supabaseRequest';
import type { FreeDrinkWindow, OpeningHours } from '@/types/venue';
import { haversineMeters, venueLatLng, type LatLng } from '@/utils/distance';

export const NEARBY_ALERT_TASK = 'cgi-nearby-free-drink';
export const NEARBY_ALERT_RADIUS_M = 500;
const ANCHOR_ID = '__anchor__';
const ANCHOR_RADIUS_M = 2000;
const MAX_VENUE_REGIONS = 19;
const MAX_ALERTS_PER_DAY = 2;
const ANCHOR_MIN_INTERVAL_MS = 2 * 60_000;

const KEY_ENABLED = 'cgi.nearbyAlerts.enabled';
const KEY_VENUES = 'cgi.nearbyAlerts.venues';
const KEY_LOG = 'cgi.nearbyAlerts.log';
const KEY_LAST_REDEEMED = 'cgi.lastRedeemedDay';
const KEY_ANCHOR = 'cgi.nearbyAlerts.anchor';
let preferenceRevision = 0;
let disabledInThisProcess = false;
let regionWork: Promise<unknown> = Promise.resolve();
let preferenceWork: Promise<unknown> = Promise.resolve();

function serializePreference(action: () => Promise<void>): Promise<void> {
  const result = preferenceWork.then(action, action);
  preferenceWork = result.catch(() => undefined);
  return result;
}

function serializeRegions(action: () => Promise<void>): Promise<void> {
  const result = regionWork.then(action, action);
  regionWork = result.catch(() => undefined);
  return result;
}

type CachedVenue = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  opening_hours: OpeningHours | null;
  drinks: { id: string; name: string }[];
  windows: FreeDrinkWindow[];
};

type AlertLog = { day: string; venueIds: string[] };

export const isNearbyAlertsSupported = Platform.OS === 'ios';

// A venue opened from a notification tap at cold start, consumed by the home screen once routing settled.
let pendingNotificationUrl: string | null = null;

export function setPendingNotificationUrl(url: string): void {
  pendingNotificationUrl = url;
}

export function takePendingNotificationUrl(): string | null {
  const url = pendingNotificationUrl;
  pendingNotificationUrl = null;
  return url;
}

function budapestDay(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest' }).format(date);
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function isNearbyAlertsEnabled(): Promise<boolean> {
  if (!isNearbyAlertsSupported || disabledInThisProcess) return false;
  return (await AsyncStorage.getItem(KEY_ENABLED).catch(() => null)) === '1';
}

/** Called after a successful free-drink redemption: no more nudges that day (one free drink per day). */
export async function markRedeemedToday(): Promise<void> {
  await AsyncStorage.setItem(KEY_LAST_REDEEMED, budapestDay()).catch(() => undefined);
}

export type NearbyAlertsPermission = 'granted' | 'notifications_denied' | 'location_denied' | 'background_denied';

export async function getNearbyAlertsPermission(): Promise<NearbyAlertsPermission> {
  const notif = await Notifications.getPermissionsAsync();
  if (!notif.granted) return 'notifications_denied';
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'location_denied';
  const bg = await Location.getBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'granted' : 'background_denied';
}

/** Asks for notifications, then location, then "Always" location. Each prompt only appears on a user tap. */
export async function requestNearbyAlertsPermission(): Promise<NearbyAlertsPermission> {
  const notif = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  if (!notif.granted) return 'notifications_denied';
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'location_denied';
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'granted' : 'background_denied';
}

export async function enableNearbyAlerts(): Promise<NearbyAlertsPermission> {
  const revision = ++preferenceRevision;
  const permission = await requestNearbyAlertsPermission();
  if (permission !== 'granted') return permission;
  if (revision !== preferenceRevision) throw new Error('Az értesítési beállítás közben megváltozott.');
  await serializePreference(async () => {
    if (revision !== preferenceRevision) return;
    await AsyncStorage.setItem(KEY_ENABLED, '1');
    if (revision === preferenceRevision) disabledInThisProcess = false;
  });
  if (revision !== preferenceRevision) throw new Error('Az értesítési beállítás közben megváltozott.');
  try {
    await syncNearbyAlerts({ refreshVenues: true });
  } catch (error) {
    if (revision === preferenceRevision) await disableNearbyAlerts();
    throw error;
  }
  return 'granted';
}

export async function disableNearbyAlerts(): Promise<void> {
  if (!isNearbyAlertsSupported) return;
  ++preferenceRevision;
  disabledInThisProcess = true;
  // Block queued tasks immediately, then let any in-flight registration finish before stopping it.
  const outcomes = await Promise.allSettled([
    serializePreference(() => AsyncStorage.setItem(KEY_ENABLED, '0')),
    serializeRegions(async () => {
      await stopRegions();
      await AsyncStorage.removeItem(KEY_ANCHOR);
    }),
    Notifications.getAllScheduledNotificationsAsync().then((pending) => Promise.all(
      pending.filter((notification) => notification.content.data?.source === 'nearby_free_drink')
        .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)),
    )),
  ]);
  const failed = outcomes.find((outcome) => outcome.status === 'rejected');
  if (failed?.status === 'rejected') throw failed.reason;
}

async function stopRegions(): Promise<void> {
  try {
    if (await Location.hasStartedGeofencingAsync(NEARBY_ALERT_TASK)) {
      await Location.stopGeofencingAsync(NEARBY_ALERT_TASK);
    }
  } catch (error) {
    console.warn('[NearbyAlerts] stop failed', error);
  }
}

// ---------------------------------------------------------------------------
// Venue cache (refreshed in the foreground, read by the background task without network)
// ---------------------------------------------------------------------------

async function refreshVenueCache(): Promise<CachedVenue[]> {
  const venues = await fetchVenues({ columns: 'id,name,coordinates,opening_hours,is_paused', orderByCreated: false, includeCovers: false });
  const cached: CachedVenue[] = [];
  for (const venue of venues) {
    const coord = venueLatLng(venue);
    const data = venue.freeDrinkData;
    if (!coord || data?.status !== 'ready') continue;
    const drinks = data.drinks.filter((drink) => drink.isFreeDrink === true)
      .map((drink) => ({ id: drink.id, name: drink.drinkName }));
    if (drinks.length === 0) continue;
    cached.push({
      id: String(venue.id), name: venue.name,
      latitude: coord.latitude, longitude: coord.longitude,
      opening_hours: venue.opening_hours ?? null,
      drinks, windows: data.windows,
    });
  }
  await AsyncStorage.setItem(KEY_VENUES, JSON.stringify(cached));
  return cached;
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

async function registerRegionsAround(center: LatLng, venues: CachedVenue[]): Promise<void> {
  const nearest = venues
    .map((v) => ({ v, d: haversineMeters(center.latitude, center.longitude, v.latitude, v.longitude) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_VENUE_REGIONS);

  const regions: Location.LocationRegion[] = nearest.map(({ v }) => ({
    identifier: v.id,
    latitude: v.latitude,
    longitude: v.longitude,
    radius: NEARBY_ALERT_RADIUS_M,
    notifyOnEnter: true,
    notifyOnExit: false,
  }));
  regions.push({
    identifier: ANCHOR_ID,
    latitude: center.latitude,
    longitude: center.longitude,
    radius: ANCHOR_RADIUS_M,
    notifyOnEnter: false,
    notifyOnExit: true,
  });

  await serializeRegions(async () => {
    if (!(await isNearbyAlertsEnabled())) return;
    await Location.startGeofencingAsync(NEARBY_ALERT_TASK, regions);
    if (!(await isNearbyAlertsEnabled())) {
      await stopRegions();
      return;
    }
    await AsyncStorage.setItem(KEY_ANCHOR, JSON.stringify({ at: Date.now(), ...center }));
  });
}

async function currentPosition(): Promise<LatLng | null> {
  try {
    const pos = await withDataTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 'Helymeghatározás', 10_000);
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch (error) {
    console.warn('[NearbyAlerts] position unavailable', error);
    return null;
  }
}

// After leaving the anchor, re-centre on a fresh fix. A stale fix would put the new anchor where the
// user no longer is, iOS would report an immediate exit, and we would loop; the guards stop that.
async function recentreAfterAnchorExit(): Promise<void> {
  const last = await readJson<{ at: number; latitude: number; longitude: number } | null>(KEY_ANCHOR, null);
  if (last && Date.now() - last.at < ANCHOR_MIN_INTERVAL_MS) return;
  const position = await currentPosition();
  if (!position) return;
  if (last && haversineMeters(last.latitude, last.longitude, position.latitude, position.longitude) < ANCHOR_RADIUS_M / 2) return;
  const venues = await readJson<CachedVenue[]>(KEY_VENUES, []);
  if (venues.length > 0) await registerRegionsAround(position, venues);
}

/**
 * Keeps the regions in line with the preference and permissions. Safe to call often
 * (app start, returning to the foreground). Stops monitoring if a permission was revoked.
 */
export async function syncNearbyAlerts(options: { refreshVenues?: boolean } = {}): Promise<void> {
  if (!isNearbyAlertsSupported) return;
  if (!(await isNearbyAlertsEnabled())) {
    await serializeRegions(stopRegions);
    return;
  }
  if ((await getNearbyAlertsPermission()) !== 'granted') {
    await serializeRegions(stopRegions);
    return;
  }

  let venues = await readJson<CachedVenue[]>(KEY_VENUES, []);
  if (options.refreshVenues || venues.length === 0) {
    venues = await refreshVenueCache().catch((error) => {
      console.warn('[NearbyAlerts] venue refresh failed, using cache', error);
      return venues;
    });
  }
  if (venues.length === 0) return;

  const position = await currentPosition();
  if (position) await registerRegionsAround(position, venues);
}

// ---------------------------------------------------------------------------
// Background task
// ---------------------------------------------------------------------------

function pickAvailableDrink(venue: CachedVenue): { id: string; name: string } | null {
  const availability = getOfferAvailability({
    opening_hours: venue.opening_hours,
    freeDrinkData: {
      status: 'ready',
      drinks: venue.drinks.map((drink) => ({ id: drink.id, venueId: venue.id, drinkName: drink.name, isFreeDrink: true })),
      windows: venue.windows,
    },
  });
  return venue.drinks.find((drink) => availability.drinkIds.includes(drink.id)) ?? null;
}

// Hungarian definite article: "az" before a vowel sound, "a" otherwise (good enough for venue names).
function withArticle(name: string): string {
  return /^[aáeéiíoóöőuúüű]/i.test(name.trim()) ? `az ${name}` : `a ${name}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function handleVenueEnter(venueId: string): Promise<void> {
  // The user is looking at the app already; the list shows the venue.
  if (AppState.currentState === 'active') return;
  if (!(await isNearbyAlertsEnabled())) return;

  const today = budapestDay();
  if ((await AsyncStorage.getItem(KEY_LAST_REDEEMED).catch(() => null)) === today) return;

  const log = await readJson<AlertLog>(KEY_LOG, { day: today, venueIds: [] });
  const todayLog: AlertLog = log.day === today ? log : { day: today, venueIds: [] };
  if (todayLog.venueIds.includes(venueId) || todayLog.venueIds.length >= MAX_ALERTS_PER_DAY) return;

  const venues = await readJson<CachedVenue[]>(KEY_VENUES, []);
  const venue = venues.find((v) => v.id === venueId);
  if (!venue) return;
  const drink = pickAvailableDrink(venue);
  if (!drink) return;
  if (!(await isNearbyAlertsEnabled())) return;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ingyen ital vár rád a közelben',
      body: `${capitalize(withArticle(venue.name))} pár percre van tőled, és most is vár rád egy ingyen ${drink.name}. Ugorj be érte!`,
      data: { url: `/venue/${venue.id}`, source: 'nearby_free_drink' },
      sound: 'default',
    },
    trigger: null,
  });
  if (!(await isNearbyAlertsEnabled())) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    await Notifications.dismissNotificationAsync(notificationId);
    return;
  }
  todayLog.venueIds.push(venueId);
  await AsyncStorage.setItem(KEY_LOG, JSON.stringify(todayLog));
}

type GeofenceTaskData = {
  eventType: Location.LocationGeofencingEventType;
  region: Location.LocationRegion;
};

if (isNearbyAlertsSupported) {
  TaskManager.defineTask<GeofenceTaskData>(NEARBY_ALERT_TASK, async ({ data, error }) => {
    if (error || !data?.region) {
      if (error) console.warn('[NearbyAlerts] task error', error.message);
      return;
    }
    try {
      if (!(await isNearbyAlertsEnabled())) return;
      const { eventType, region } = data;
      if (region.identifier === ANCHOR_ID) {
        if (eventType === Location.LocationGeofencingEventType.Exit) await recentreAfterAnchorExit();
        return;
      }
      if (eventType === Location.LocationGeofencingEventType.Enter && region.identifier) {
        await handleVenueEnter(region.identifier);
      }
    } catch (taskError) {
      console.warn('[NearbyAlerts] task failed', taskError);
    }
  });

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
