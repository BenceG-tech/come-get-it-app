import { useEffect, useState, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { Venue } from '@/types/venue';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_RADIUS = 500;

type LocationContextType = {
  location: Location.LocationObject | null;
  hasPermission: boolean;
  isTracking: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  checkProximityToVenues: (venues: Venue[]) => Venue[];
};

export const [LocationProvider, useLocation] = createContextHook<LocationContextType>(() => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const checkPermissions = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setHasPermission(status === 'granted');
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Engedély szükséges',
          'A helymeghatározás engedélyezése szükséges a közeli helyszínek megjelenítéséhez.'
        );
        return false;
      }

      setHasPermission(true);

      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (backgroundStatus !== 'granted') {
          Alert.alert(
            'Háttér helymeghatározás',
            'A háttérben történő helymeghatározás engedélyezése lehetővé teszi, hogy értesítést kapj, amikor egy partner helyszín közelében vagy.'
          );
        }
      }

      return true;
    } catch (error) {
      console.error('[Location] Permission request failed:', error);
      return false;
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      setIsTracking(true);

      if (Platform.OS !== 'web') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000,
          distanceInterval: 100,
          foregroundService: {
            notificationTitle: 'Come Get It',
            notificationBody: 'Helymeghatározás aktív',
          },
        });
      } else {
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60000,
            distanceInterval: 100,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      }

      console.log('[Location] Tracking started');
    } catch (error) {
      console.error('[Location] Failed to start tracking:', error);
      Alert.alert('Hiba', 'Nem sikerült elindítani a helymeghatározást');
    }
  }, [hasPermission, requestPermission]);

  const stopTracking = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasStarted) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      }
      setIsTracking(false);
      console.log('[Location] Tracking stopped');
    } catch (error) {
      console.error('[Location] Failed to stop tracking:', error);
    }
  }, []);

  const checkProximityToVenues = useCallback((venues: Venue[]): Venue[] => {
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
  }, [location]);

  return useMemo(() => ({
    location,
    hasPermission,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
    checkProximityToVenues,
  }), [location, hasPermission, isTracking, requestPermission, startTracking, stopTracking, checkProximityToVenues]);
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

if (Platform.OS !== 'web') {
  import('expo-task-manager').then((TaskManager) => {
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: { data: any; error: any }) => {
      if (error) {
        console.error('[Location Task] Error:', error);
        return;
      }
      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const latestLocation = locations[0];
        console.log('[Location Task] New location:', latestLocation.coords);
      }
    });
  }).catch((err) => {
    console.error('[Location] Failed to load TaskManager:', err);
  });
}
