import type { RedemptionWindow } from '@/lib/redemptionService';

type ActiveRedemption = { userId: string; venueId: string; drinkId: string; window: RedemptionWindow };
let owner: string | null = null;
let active: ActiveRedemption | null = null;

/** Memory only: a raw QR token is never written to analytics or persistent storage. */
export function setRedemptionOwner(userId: string | null): void {
  if (owner !== userId) active = null;
  owner = userId;
}

export function rememberRedemption(value: ActiveRedemption): void {
  if (value.userId === owner && !value.window.demo_mode && !value.window.fallback_mode) active = value;
}

export function recallRedemption(userId: string, venueId: string, drinkId: string): RedemptionWindow | null {
  if (!active || active.userId !== userId || userId !== owner || active.venueId !== venueId || active.drinkId !== drinkId) return null;
  // Keep an elapsed token briefly so the server can confirm a last-second scan.
  if (Date.parse(active.window.expires_at) + 10 * 60_000 < Date.now()) { active = null; return null; }
  return active.window;
}

export function forgetRedemption(token: string): void {
  if (active?.window.token === token) active = null;
}
