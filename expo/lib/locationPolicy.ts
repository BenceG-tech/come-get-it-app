type Position = { timestamp: number; coords: { latitude: number; longitude: number; accuracy?: number | null } };

/** Reuse only a recent measured position; unknown accuracy is not a GPS fix. */
export function isFreshAccurateLocation(position: Position | null | undefined, now = Date.now()): boolean {
  if (!position || !Number.isFinite(position.timestamp)) return false;
  const { latitude, longitude, accuracy } = position.coords;
  const age = now - position.timestamp;
  return age >= 0 && age <= 15_000 && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) && Math.abs(longitude) <= 180 &&
    typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= 100;
}
