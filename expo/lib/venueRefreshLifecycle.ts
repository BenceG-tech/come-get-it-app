type AppStateSource = {
  currentState: string | null;
  addEventListener: (event: 'change', listener: (state: any) => void) => { remove: () => void };
};

/** One fresh request on screen focus, then on background/inactive → active only. */
export function startVenueRefreshLifecycle(appState: AppStateSource, refresh: () => void, cancel: () => void) {
  let previous = appState.currentState;
  refresh();
  const subscription = appState.addEventListener('change', (next: string) => {
    if (next === 'active' && previous !== 'active') refresh();
    previous = next;
  });
  return () => { subscription.remove(); cancel(); };
}
