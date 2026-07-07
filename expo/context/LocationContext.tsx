import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { Venue } from '@/types/venue';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_RADIUS = 500;

type LocationCoords = {
  latitude: number;
  longitude: number;
};

type LocationObjectLike = {
  coords: LocationCoords;
  timestamp: number;
};

type LocationContextType = {
  location: LocationObjectLike | null;
  hasPermission: boolean;
  isTracking: boolean;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationObjectLike | null>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  checkProximityToVenues: (venues: Venue[]) => Venue[];
};

let cachedExpoLocationPromise: Promise<typeof import('expo-location')> | null = null;
async function getExpoLocationModule(): Promise<typeof import('expo-location')> {
  if (!cachedExpoLocationPromise) {
    cachedExpoLocationPromise = import('expo-location');
  }
  return cachedExpoLocationPromise;
}

let cachedTaskManagerPromise: Promise<typeof import('expo-task-manager')> | null = null;
async function getTaskManagerModule(): Promise<typeof import('expo-task-manager')> {
  if (!cachedTaskManagerPromise) {
    cachedTaskManagerPromise = import('expo-task-manager');
  }
  return cachedTaskManagerPromise;
}

function getWebLocationOnce(): Promise<LocationObjectLike> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          timestamp: pos.timestamp,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
    );
  });
}

export const [LocationProvider, useLocation] = createContextHook<LocationContextType>(() => {
  const [location, setLocation] = useState<LocationObjectLike | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const webWatchIdRef = useRef<number | null>(null);
  const nativeSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        if (Platform.OS === 'web') {
          setHasPermission(true);
          return;
        }

        const Location = await getExpoLocationModule();
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isMounted) setHasPermission(status === 'granted');
      } catch (e) {
        console.log('[Location] init failed:', e);
        if (isMounted) setHasPermission(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        try {
          await getWebLocationOnce();
          setHasPermission(true);
          return true;
        } catch (e) {
          console.log('[Location] Web permission / location unavailable:', e);
          setHasPermission(false);
          return false;
        }
      }

      const Location = await getExpoLocationModule();
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Engedély szükséges',
          'A helymeghatározás engedélyezése szükséges a közeli helyszínek megjelenítéséhez.'
        );
        setHasPermission(false);
        return false;
      }

      setHasPermission(true);

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Háttér helymeghatározás',
          'A háttérben történő helymeghatározás engedélyezése lehetővé teszi, hogy értesítést kapj, amikor egy partner helyszín közelében vagy.'
        );
      }

      return true;
    } catch (error) {
      console.log('[Location] Permission request failed:', error);
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationObjectLike | null> => {
    const granted = hasPermission || await requestPermission();
    if (!granted) return null;

    try {
      if (Platform.OS === 'web') {
        const current = await getWebLocationOnce();
        setLocation(current);
        return current;
      }

      const Location = await getExpoLocationModule();
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const nextLocation: LocationObjectLike = {
        coords: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        timestamp: currentLocation.timestamp,
      };
      setLocation(nextLocation);
      return nextLocation;
    } catch (error) {
      console.log('[Location] Failed to get current location:', error);
      return null;
    }
  }, [hasPermission, requestPermission]);

  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      if (Platform.OS === 'web') {
        const current = await getWebLocationOnce();
        setLocation(current);
        setIsTracking(true);

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          if (webWatchIdRef.current != null) {
            navigator.geolocation.clearWatch(webWatchIdRef.current);
          }
          webWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              setLocation({
                coords: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                },
                timestamp: pos.timestamp,
              });
            },
            (err) => {
              console.log('[Location] Web watch error:', err);
            },
            { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
          );
        }

        console.log('[Location] Tracking started (web)');
        return;
      }

      const Location = await getExpoLocationModule();
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        coords: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        timestamp: currentLocation.timestamp,
      });

      setIsTracking(true);

      try {
        const TaskManager = await getTaskManagerModule();
        TaskManager.defineTask(
          LOCATION_TASK_NAME,
          async ({ data, error }: { data: unknown; error: unknown }) => {
            if (error) {
              console.error('[Location Task] Error:', error);
              return;
            }
            if (!data) return;

            try {
              const { locations } = data as { locations: { coords: LocationCoords; timestamp: number }[] };
              const latest = locations?.[0];
              if (latest?.coords) {
                console.log('[Location Task] New location:', latest.coords);
              }
            } catch (e) {
              console.error('[Location Task] Parse error:', e);
            }
          }
        );
      } catch (e) {
        console.error('[Location Task] Failed to register background task:', e);
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 100,
        foregroundService: {
          notificationTitle: 'Come Get It',
          notificationBody: 'Helymeghatározás aktív',
        },
      });

      console.log('[Location] Tracking started (native)');
    } catch (error) {
      console.log('[Location] Failed to start tracking:', error);
    }
  }, [hasPermission, requestPermission]);

  const stopTracking = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.geolocation && webWatchIdRef.current != null) {
          navigator.geolocation.clearWatch(webWatchIdRef.current);
          webWatchIdRef.current = null;
        }
        nativeSubscriptionRef.current?.remove();
        nativeSubscriptionRef.current = null;
        setIsTracking(false);
        console.log('[Location] Tracking stopped (web)');
        return;
      }

      const Location = await getExpoLocationModule();
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      setIsTracking(false);
      console.log('[Location] Tracking stopped (native)');
    } catch (error) {
      console.log('[Location] Failed to stop tracking:', error);
    }
  }, []);

  const checkProximityToVenues = useCallback(
    (venues: Venue[]): Venue[] => {
      if (!location || !venues.length) return [];

      const nearbyVenues: Venue[] = [];

      venues.forEach((venue) => {
        if (venue.latitude && venue.longitude) {
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            venue.latitude,
            venue.longitude
          );

          if (distance <= GEOFENCE_RADIUS) {
            nearbyVenues.push({ ...venue, distance });
          }
        }
      });

      return nearbyVenues;
    },
    [location]
  );

  return useMemo(
    () => ({
      location,
      hasPermission,
      isTracking,
      requestPermission,
      getCurrentLocation,
      startTracking,
      stopTracking,
      checkProximityToVenues,
    }),
    [
      location,
      hasPermission,
      isTracking,
      requestPermission,
      getCurrentLocation,
      startTracking,
      stopTracking,
      checkProximityToVenues,
    ]
  );
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
