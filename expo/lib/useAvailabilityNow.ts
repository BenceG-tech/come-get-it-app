import { useMemo, useSyncExternalStore } from 'react';
import { AppState, type NativeEventSubscription } from 'react-native';

// One clock for every mounted card/screen, refreshed at minute boundaries and on app resume.
let timestamp = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
let subscription: NativeEventSubscription | undefined;
function tick() {
  timestamp = Date.now();
  listeners.forEach((listener) => listener());
  if (timer) clearTimeout(timer);
  if (listeners.size) timer = setTimeout(tick, 60_000 - timestamp % 60_000 + 10);
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    tick();
    subscription = AppState.addEventListener('change', (state) => { if (state === 'active') tick(); });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearTimeout(timer);
      subscription?.remove();
      subscription = undefined;
    }
  };
}
const snapshot = () => timestamp;
export function useAvailabilityNow(): Date {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => new Date(value), [value]);
}
