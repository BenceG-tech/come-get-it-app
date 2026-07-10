import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Venue } from '@/types/venue';
import { rest } from '@/lib/supabaseRest';
import { fetchVenues } from '@/lib/venueService';
import DarkMapPreview from '@/components/DarkMapPreview';
import VenueMiniCard from '@/components/VenueMiniCard';
import { geocodeVenueAddress } from '@/utils/geocoding';
import { useLocation } from '@/context/LocationContext';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export default function MapScreen() {
  const router = useRouter();
  const statusBarStyle = 'light' as const;
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [previewVenue, setPreviewVenue] = useState<Venue | null>(null);

  const { location: userLocation, getCurrentLocation } = useLocation();

  useEffect(() => {
    getCurrentLocation()
      .then((loc) => {
        console.log('[Map] User location resolved:', loc?.coords ?? null);
      })
      .catch((e) => console.log('[Map] Failed to resolve user location:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMiniCardDetails = useCallback(
    (venue: Venue) => {
      setPreviewVenue(null);
      router.push(`/venue/${venue.id}`);
    },
    [router]
  );

  useEffect(() => {
    const fetchVenuesAndLocation = async () => {
      try {
        const venuesData: Venue[] = await fetchVenues({ orderByCreated: true });
        console.log('[Map] Fetched venues:', venuesData.length);
        
        // Geocode venues that don't have coordinates.
        // IMPORTANT: Some Supabase schemas do not have latitude/longitude columns.
        // In that case, PATCH will return PGRST204. We treat this as non-fatal and
        // keep coordinates in-memory for the map.
        const venuesWithCoords = await Promise.all(
          venuesData.map(async (venue) => {
            const latFromVenue = typeof (venue as any).latitude === 'number' ? (venue as any).latitude : null;
            const lngFromVenue = typeof (venue as any).longitude === 'number' ? (venue as any).longitude : null;
            const latFromCoords = typeof venue.coordinates?.lat === 'number' ? venue.coordinates.lat : null;
            const lngFromCoords = typeof venue.coordinates?.lng === 'number' ? venue.coordinates.lng : null;

            const existingLat = latFromVenue ?? latFromCoords;
            const existingLng = lngFromVenue ?? lngFromCoords;

            if (existingLat !== null && existingLng !== null) {
              return { ...venue, latitude: existingLat, longitude: existingLng };
            }

            if (venue.address) {
              try {
                const coordinates = await geocodeVenueAddress(venue.name, venue.address);

                if (coordinates) {
                  console.log('[Map] Geocoded venue', { id: venue.id, name: venue.name, coordinates });

                  try {
                    const patchRes = await rest(`/venues?id=eq.${venue.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ latitude: coordinates.lat, longitude: coordinates.lng }),
                    });

                    if (!patchRes.ok) {
                      let errPayload: unknown = null;
                      try {
                        errPayload = await patchRes.json();
                      } catch {
                        try {
                          errPayload = await patchRes.text();
                        } catch {
                          errPayload = null;
                        }
                      }

                      const payloadStr = typeof errPayload === 'string' ? errPayload : JSON.stringify(errPayload);
                      if (payloadStr.includes('PGRST204') && payloadStr.includes('latitude')) {
                        console.warn('[Map] Skipping coordinates PATCH due to missing DB columns', {
                          venueId: venue.id,
                          payload: errPayload,
                        });
                      } else {
                        console.warn('[Map] Venue PATCH failed (non-fatal)', {
                          venueId: venue.id,
                          status: patchRes.status,
                          payload: errPayload,
                        });
                      }
                    } else {
                      console.log('[Map] Venue coordinates PATCH ok', { venueId: venue.id });
                    }
                  } catch (e) {
                    console.warn('[Map] Venue PATCH threw (non-fatal)', { venueId: venue.id, e });
                  }

                  return { ...venue, latitude: coordinates.lat, longitude: coordinates.lng };
                }
              } catch (geocodeError) {
                console.error('[Map] Failed to geocode venue', { id: venue.id, name: venue.name, geocodeError });
              }
            }

            return venue;
          })
        );

        console.log('[Map] venues after geocode', {
          total: venuesWithCoords.length,
          withCoords: venuesWithCoords.filter(
            (v) => typeof (v as any).latitude === 'number' && typeof (v as any).longitude === 'number'
          ).length,
        });
        setVenues(venuesWithCoords as Venue[]);
        setLoadError(false);
      } catch (error) {
        console.error('[Map] Error fetching data:', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVenuesAndLocation();
  }, []);

  const userCoords = userLocation?.coords ?? null;

  const venuesSorted = useMemo(() => {
    const withDistance = venues.map((v) => {
      if (
        userCoords &&
        typeof v.latitude === 'number' &&
        typeof v.longitude === 'number'
      ) {
        return {
          ...v,
          distance: haversineMeters(userCoords.latitude, userCoords.longitude, v.latitude, v.longitude),
        };
      }
      return v;
    });
    if (userCoords) {
      withDistance.sort(
        (a, b) => (typeof a.distance === 'number' ? a.distance : Infinity) - (typeof b.distance === 'number' ? b.distance : Infinity)
      );
    }
    return withDistance;
  }, [venues, userCoords]);

  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} />

      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log('[Map] Back pressed');
              router.back();
            }}
            testID="map-back"
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Térkép</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search')} testID="map-search">
              <Search size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Térkép betöltése...</Text>
        </View>
      ) : (
        <DarkMapBody
          venues={venuesSorted}
          loadError={loadError}
          router={router}
          previewVenue={previewVenue}
          onMarkerPress={(venue) => setPreviewVenue(venue)}
          onClosePreview={() => setPreviewVenue(null)}
          onDetails={onMiniCardDetails}
          userCoordinate={userCoords}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 12,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  webFallbackTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  webFallbackText: {
    color: '#A6A6AD',
    fontSize: 14,
    textAlign: 'center',
  },
  webFallbackButton: {
    marginTop: 8,
    backgroundColor: '#2BB7FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  webFallbackButtonText: {
    color: '#0B0B0B',
    fontSize: 14,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  webMapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  webMapCanvas: {
    flex: 1,
  },
  webSheet: {
    height: '42%',
    backgroundColor: 'rgba(12, 12, 14, 0.98)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  webSheetHandleRow: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeMapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '92%',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheetCard: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 14, 0.92)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
  },
  sheetHandleRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sheetChevronButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sheetSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetListContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 10,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  venueRowPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  venueRowLeft: {
    paddingRight: 10,
  },
  venueRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(43,183,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(43,183,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueRowBody: {
    flex: 1,
  },
  venueRowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  venueRowTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  venueRowDistance: {
    color: '#00D1FF',
    fontSize: 12,
    fontWeight: '800',
  },
  venueRowAddress: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
  },
  venueRowTags: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
  },
});

function DarkMapBody({
  venues,
  loadError,
  router,
  previewVenue,
  onMarkerPress,
  onClosePreview,
  onDetails,
  userCoordinate,
}: {
  venues: Venue[];
  loadError: boolean;
  router: ReturnType<typeof useRouter>;
  previewVenue: Venue | null;
  onMarkerPress: (venue: Venue) => void;
  onClosePreview: () => void;
  onDetails: (venue: Venue) => void;
  userCoordinate: { latitude: number; longitude: number } | null;
}) {
  return (
    <View style={styles.webMapContainer} testID="dark-map">
      <DarkMapPreview
        venues={venues}
        zoom={13}
        style={styles.webMapCanvas}
        interactive
        controlsBottomOffset={24}
        userCoordinate={userCoordinate}
        onMarkerPress={(venue) => {
          console.log('[Map] Web marker pressed, showing mini card:', venue.id);
          onMarkerPress(venue);
        }}
      />

      <View style={styles.webSheet}>
        <View style={styles.webSheetHandleRow}>
          <View style={styles.sheetHandle} />
        </View>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Helyszínek</Text>
          <Text style={styles.sheetSubtitle}>
            {loadError ? 'Nem sikerült betölteni a helyszíneket — próbáld újra később' : `${venues.length} találat`}
          </Text>
        </View>
        <FlatList
          data={venues}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const tags = Array.isArray(item.tags) ? item.tags : [];
            return (
              <Pressable
                onPress={() => {
                  console.log('[Map] Venue row pressed:', item.id);
                  router.push(`/venue/${item.id}`);
                }}
                style={({ pressed }) => [styles.venueRow, pressed && styles.venueRowPressed]}
                testID={`venue-row-${item.id}`}
              >
                <View style={styles.venueRowLeft}>
                  <View style={styles.venueRowIcon}>
                    <MapPin size={16} color={Colors.dark.primary} />
                  </View>
                </View>
                <View style={styles.venueRowBody}>
                  <View style={styles.venueRowTitleRow}>
                    <Text style={styles.venueRowTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {typeof item.distance === 'number' ? (
                      <Text style={styles.venueRowDistance}>{formatDistance(item.distance)}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.venueRowAddress} numberOfLines={1}>
                    {item.address ?? ''}
                  </Text>
                  {tags.length > 0 ? (
                    <Text style={styles.venueRowTags} numberOfLines={1}>
                      {tags.slice(0, 4).join(' • ')}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.sheetListContent}
          showsVerticalScrollIndicator={false}
          testID="venue-list"
        />
      </View>

      {previewVenue && (
        <VenueMiniCard
          venue={previewVenue}
          onClose={onClosePreview}
          onDetails={onDetails}
          bottomOffset={24}
          testID="map-venue-mini-card"
        />
      )}
    </View>
  );
}