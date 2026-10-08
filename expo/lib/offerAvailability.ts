import type { FreeDrinkWindow, Venue, VenueDrink } from '../types/venue';

export const VENUE_TIME_ZONE = 'Europe/Budapest';
type AvailabilityState = 'available' | 'unavailable' | 'unknown';
export type OfferAvailability = {
  status: AvailabilityState;
  drinkIds: string[];
  reason: 'available' | 'venue_hidden' | 'venue_closed' | 'no_free_drink' | 'outside_window' | 'data_unavailable';
};

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const formatters = new Map<string, Intl.DateTimeFormat>();

function localClock(now: Date, timeZone: string): { day: number; minute: number } | null {
  try {
    let formatter = formatters.get(timeZone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      formatters.set(timeZone, formatter);
    }
    const parts = formatter.formatToParts(now);
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
    const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(part('weekday')) + 1;
    const minute = Number(part('hour')) * 60 + Number(part('minute'));
    return day > 0 && Number.isFinite(minute) ? { day, minute } : null;
  } catch {
    return null;
  }
}

/** Supports HH, HH:mm and PostgreSQL HH:mm:ss; 24:00 is valid only as an end. */
function minuteOfDay(value: unknown, end = false): number | null {
  if (typeof value !== 'string' || !/^\d{1,2}(?::\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.test(value)) return null;
  const [hour, minute = 0, second = 0] = value.split(':').map(Number);
  if (end && hour === 24 && minute === 0 && second === 0) return 1440;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second >= 60) return null;
  return hour * 60 + minute + second / 60;
}

function activeInterval(days: number[], start: number, end: number, day: number, minute: number): boolean {
  if (start === end) return false; // Zero-length/ambiguous intervals do not advertise an offer.
  if (end > start) return days.includes(day) && minute >= start && minute < end;
  const previousDay = day === 1 ? 7 : day - 1;
  return (days.includes(day) && minute >= start) || (days.includes(previousDay) && minute < end);
}

export function getWindowAvailability(window: FreeDrinkWindow, now = new Date()): AvailabilityState {
  const clock = localClock(now, window.timezone || VENUE_TIME_ZONE);
  const start = minuteOfDay(window.start);
  const end = minuteOfDay(window.end, true);
  const days = window.days ?? (typeof window.dayOfWeek === 'number' ? [window.dayOfWeek + 1] : []);
  if (!clock || start === null || end === null || days.length === 0 || days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) return 'unknown';
  return activeInterval(days, start, end, clock.day, clock.minute) ? 'available' : 'unavailable';
}

export function getNextDrinkWindow(windows: FreeDrinkWindow[], drinkId: string, now = new Date()): { day: number; start: string; end: string } | null {
  let next: { offset: number; day: number; start: string; end: string } | null = null;
  for (const window of windows) {
    if (String(window.drinkId) !== String(drinkId) || getWindowAvailability(window, now) === 'unknown') continue;
    const clock = localClock(now, window.timezone || VENUE_TIME_ZONE);
    const start = minuteOfDay(window.start);
    if (!clock || start === null) continue;
    const days = window.days ?? (typeof window.dayOfWeek === 'number' ? [window.dayOfWeek + 1] : []);
    for (const day of days) {
      let dayOffset = (day - clock.day + 7) % 7;
      if (dayOffset === 0 && start <= clock.minute) dayOffset = 7;
      const offset = dayOffset * 1440 + start - clock.minute;
      if (!next || offset < next.offset) next = { offset, day, start: window.start, end: window.end };
    }
  }
  return next ? { day: next.day, start: next.start, end: next.end } : null;
}

/** Opening hours belong to the venue's local day, including yesterday's overnight period. */
export function getVenueOpeningState(openingHours: unknown, now = new Date()): AvailabilityState {
  let hours = openingHours;
  if (typeof hours === 'string') {
    try { hours = JSON.parse(hours); } catch { return 'unknown'; }
  }
  if (!hours || typeof hours !== 'object') return 'unknown';
  const record = hours as Record<string, unknown>;
  const clock = localClock(now, VENUE_TIME_ZONE);
  if (!clock) return 'unknown';
  const byDay = record.byDay && typeof record.byDay === 'object' ? record.byDay as Record<string, unknown> : null;
  const recognized = byDay ? Object.keys(byDay).some((key) => /^[1-7]$/.test(key)) : dayNames.some((day) => day in record);
  if (!recognized) return 'unknown';
  let hasUnknown = false;
  const previousDay = clock.day === 1 ? 7 : clock.day - 1;
  for (const day of [clock.day, previousDay]) {
    const value = byDay ? byDay[String(day)] : record[dayNames[day - 1]];
    if (value == null) continue; // In the saved schedule, omitted days are closed.
    if (typeof value !== 'object') { hasUnknown = true; continue; }
    const interval = value as Record<string, unknown>;
    if (interval.closed === true) continue;
    const start = minuteOfDay(interval.open);
    const end = minuteOfDay(interval.close, true);
    if (start === null || end === null || start === end) { hasUnknown = true; continue; }
    if (activeInterval([day], start, end, clock.day, clock.minute)) return 'available';
  }
  return hasUnknown ? 'unknown' : 'unavailable';
}

/** General venue offer availability, independent of the customer's daily redemption limit. */
export function getOfferAvailability(venue: Pick<Venue, 'is_paused' | 'opening_hours' | 'freeDrinkData'>, now = new Date()): OfferAvailability {
  const unavailable = (reason: OfferAvailability['reason']): OfferAvailability => ({ status: 'unavailable', drinkIds: [], reason });
  const unknown: OfferAvailability = { status: 'unknown', drinkIds: [], reason: 'data_unavailable' };
  if (venue.is_paused === true) return unavailable('venue_hidden');
  const data = venue.freeDrinkData;
  if (!data || data.status !== 'ready') return unknown;
  const drinks = data.drinks.filter((drink: VenueDrink) => drink.isFreeDrink === true);
  if (drinks.length === 0) return unavailable('no_free_drink');
  const opening = getVenueOpeningState(venue.opening_hours, now);
  if (opening === 'unknown') return unknown;
  if (opening !== 'available') return unavailable('venue_closed');
  let uncertain = false;
  const drinkIds = drinks.filter((drink) => {
    const windows = data.windows.filter((window) => String(window.drinkId) === String(drink.id));
    if (windows.length === 0) return true; // Known empty schedule: available during venue opening hours.
    const states = windows.map((window) => getWindowAvailability(window, now));
    uncertain ||= states.includes('unknown');
    return states.includes('available');
  }).map((drink) => drink.id);
  if (drinkIds.length > 0) return { status: 'available', drinkIds, reason: 'available' };
  return uncertain ? unknown : unavailable('outside_window');
}

export function hasAvailableFreeDrink(venue: Pick<Venue, 'is_paused' | 'opening_hours' | 'freeDrinkData'>, now = new Date()): boolean {
  return getOfferAvailability(venue, now).status === 'available';
}

/** The detail page describes configured offers, including ones outside their time window. */
export function getConfiguredFreeDrinks(venue: Pick<Venue, 'is_paused' | 'freeDrinkData'>): VenueDrink[] {
  if (venue.is_paused || venue.freeDrinkData?.status !== 'ready') return [];
  return venue.freeDrinkData.drinks.filter((drink) => drink.isFreeDrink === true);
}

export function getDrinkOfferAvailability(venue: Pick<Venue, 'is_paused' | 'opening_hours' | 'freeDrinkData'>, drinkId: string, now = new Date()): OfferAvailability {
  const data = venue.freeDrinkData;
  return getOfferAvailability({ ...venue, freeDrinkData: data && { ...data, drinks: data.drinks.filter((drink) => drink.id === drinkId) } }, now);
}

export function getVenueISODay(now = new Date()): number {
  return localClock(now, VENUE_TIME_ZONE)?.day ?? 1;
}

/** Display the published schedule without confusing it with eligibility at this instant. */
export function getDrinkScheduleForDay(windows: FreeDrinkWindow[], drinkId: string, day: number): string | null {
  const periods = windows.filter((window) => {
    const days = window.days ?? (typeof window.dayOfWeek === 'number' ? [window.dayOfWeek + 1] : []);
    return String(window.drinkId) === String(drinkId) && days.includes(day)
      && getWindowAvailability(window) !== 'unknown' && minuteOfDay(window.start) !== minuteOfDay(window.end, true);
  }).sort((a, b) => minuteOfDay(a.start)! - minuteOfDay(b.start)!);
  const format = (value: string) => value.includes(':') ? value.slice(0, 5).padStart(5, '0') : `${value.padStart(2, '0')}:00`;
  const slots = [...new Set(periods.map((period) => `${format(period.start)}–${format(period.end)}${minuteOfDay(period.end, true)! < minuteOfDay(period.start)! ? ' (másnap)' : ''}`))];
  return slots.length ? slots.join(', ') : null;
}
