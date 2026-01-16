import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  PanResponder,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, MapPin, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Venue } from '@/types/venue';
import { rest } from '@/lib/supabaseRest';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/lib/mapComponents';

let Location: any = null;

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type BottomSheetSnap = {
  expandedHeight: number;
  collapsedHeight: number;
  maxTranslateY: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export default function MapScreen() {
  const router = useRouter();
  const statusBarStyle = 'light' as const;
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [sheetMode, setSheetMode] = useState<'collapsed' | 'expanded'>('collapsed');

  useEffect(() => {
    const fetchVenuesAndLocation = async () => {
      try {
        const venuesResponse = await rest('/venues?select=*');
        let venuesData: Venue[] = await venuesResponse.json();
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
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  `${venue.address}, Budapest, Hungary`
                )}&limit=1`;

                const geocodeResponse = await fetch(geocodeUrl, {
                  headers: {
                    'User-Agent': 'RorkApp/1.0',
                  },
                });
                const geocodeData = (await geocodeResponse.json()) as any[];

                if (Array.isArray(geocodeData) && geocodeData.length > 0) {
                  const lat = Number.parseFloat(String(geocodeData[0]?.lat ?? ''));
                  const lon = Number.parseFloat(String(geocodeData[0]?.lon ?? ''));

                  if (Number.isFinite(lat) && Number.isFinite(lon)) {
                    console.log('[Map] Geocoded venue', { id: venue.id, name: venue.name, lat, lon });

                    try {
                      const patchRes = await rest(`/venues?id=eq.${venue.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude: lat, longitude: lon }),
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

                    return { ...venue, latitude: lat, longitude: lon };
                  }
                }
              } catch (geocodeError) {
                console.error('[Map] Failed to geocode venue', { id: venue.id, name: venue.name, geocodeError });
              }
            }

            return venue;
          })
        );

        const filteredWithCoords = venuesWithCoords.filter(
          (v) => typeof (v as any).latitude === 'number' && typeof (v as any).longitude === 'number'
        );
        console.log('[Map] venuesWithCoords after geocode', {
          total: venuesWithCoords.length,
          withCoords: filteredWithCoords.length,
        });
        setVenues(filteredWithCoords as Venue[]);

        if (Platform.OS !== 'web' && Location) {
          const locationStatus = await Location.requestForegroundPermissionsAsync();
          if (locationStatus.status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location);
            console.log('[Map] User location:', location.coords);
          } else {
            console.log('[Map] Location permission denied');
          }
        }
      } catch (error) {
        console.error('[Map] Error fetching data:', error);
        Alert.alert('Hiba', 'Nem sikerült betölteni a térképet');
      } finally {
        setLoading(false);
      }
    };

    fetchVenuesAndLocation();
  }, []);

  const initialRegion: MapRegion = userLocation
    ? {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 47.4979,
        longitude: 19.0402,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  const venuesWithCoords = useMemo(() => {
    const filtered = venues.filter((v) => typeof v.latitude === 'number' && typeof v.longitude === 'number');
    console.log('[Map] venuesWithCoords:', filtered.length);
    return filtered;
  }, [venues]);

  const sheetSnap = useRef<BottomSheetSnap | null>(null);

  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetTranslateYStart = useRef<number>(0);

  const onSheetLayout = useCallback((h: number) => {
    const mapAreaHeight = h;
    const expandedHeight = clamp(mapAreaHeight * 0.92, 320, mapAreaHeight);
    const collapsedHeight = clamp(mapAreaHeight * 0.32, 180, expandedHeight);
    const maxTranslateY = expandedHeight - collapsedHeight;

    sheetSnap.current = { expandedHeight, collapsedHeight, maxTranslateY };
    const initial = maxTranslateY;
    sheetTranslateY.setValue(initial);
    sheetTranslateYStart.current = initial;
    setSheetMode('collapsed');

    console.log('[Map] Bottom sheet layout:', { mapAreaHeight, expandedHeight, collapsedHeight, maxTranslateY });
  }, [sheetTranslateY]);

  const snapSheetTo = useCallback(
    (mode: 'collapsed' | 'expanded') => {
      const snap = sheetSnap.current;
      if (!snap) return;
      const toValue = mode === 'expanded' ? 0 : snap.maxTranslateY;

      setSheetMode(mode);
      Animated.spring(sheetTranslateY, {
        toValue,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start(() => {
        sheetTranslateYStart.current = toValue;
      });
    },
    [sheetTranslateY]
  );

  const sheetPanResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation((value) => {
          sheetTranslateYStart.current = typeof value === 'number' ? value : 0;
        });
      },
      onPanResponderMove: (_evt, gesture) => {
        const snap = sheetSnap.current;
        if (!snap) return;
        const next = clamp(sheetTranslateYStart.current + gesture.dy, 0, snap.maxTranslateY);
        sheetTranslateY.setValue(next);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const snap = sheetSnap.current;
        if (!snap) return;

        const shouldExpand = gesture.vy < -0.25 || (gesture.dy < -snap.maxTranslateY * 0.2);
        const shouldCollapse = gesture.vy > 0.25 || (gesture.dy > snap.maxTranslateY * 0.2);

        if (shouldExpand) snapSheetTo('expanded');
        else if (shouldCollapse) snapSheetTo('collapsed');
        else snapSheetTo(sheetMode);
      },
    });
  }, [sheetMode, sheetTranslateY, snapSheetTo]);

  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} />

      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              const canGoBack = (router as any)?.canGoBack?.();
              console.log('[Map] Back pressed', { canGoBack });
              if (canGoBack) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
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
      ) : Platform.OS !== 'web' && MapView ? (
        <View
          style={styles.nativeMapContainer}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) onSheetLayout(h);
          }}
          testID="native-map-container"
        >
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            toolbarEnabled={false}
            testID="native-map"
          >
            {venuesWithCoords.map((v) => (
              <Marker
                key={String(v.id)}
                coordinate={{ latitude: v.latitude as number, longitude: v.longitude as number }}
                title={v.name}
                description={v.address ?? undefined}
                onPress={() => {
                  console.log('[Map] Marker pressed:', v.id, v.name);
                  router.push(`/venue/${v.id}`);
                }}
                testID={`venue-marker-${v.id}`}
              />
            ))}
          </MapView>

          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
            pointerEvents="box-none"
            testID="map-bottom-sheet"
          >
            <View style={styles.sheetCard} pointerEvents="auto">
              <View style={styles.sheetHandleRow} {...sheetPanResponder.panHandlers} testID="sheet-handle">
                <View style={styles.sheetHandle} />
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => snapSheetTo(sheetMode === 'expanded' ? 'collapsed' : 'expanded')}
                  style={({ pressed }) => [styles.sheetChevronButton, pressed && { opacity: 0.7 }]}
                  testID="sheet-toggle"
                >
                  <ChevronUp
                    size={18}
                    color={Colors.text}
                    style={{ transform: [{ rotate: sheetMode === 'expanded' ? '180deg' : '0deg' }] }}
                  />
                </Pressable>
              </View>

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Helyszínek</Text>
                <Text style={styles.sheetSubtitle}>{venuesWithCoords.length} találat</Text>
              </View>

              <FlatList
                data={venuesWithCoords}
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
                        <Text style={styles.venueRowTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
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
          </Animated.View>
        </View>
      ) : (
        <WebMapView venues={venues} initialRegion={initialRegion} router={router} />
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
  venueRowTitle: {
    color: Colors.text,
    fontSize: 15,
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

function WebMapView({ venues, initialRegion, router }: { venues: Venue[]; initialRegion: any; router: any }) {
  const center = `${initialRegion.latitude},${initialRegion.longitude}`;
  const staticUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(center)}&zoom=13&size=900x500&maptype=mapnik&markers=${encodeURIComponent(center)},lightblue1`;

  return (
    <View style={styles.webMapContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          const url = `https://www.openstreetmap.org/?mlat=${initialRegion.latitude}&mlon=${initialRegion.longitude}#map=13/${initialRegion.latitude}/${initialRegion.longitude}`;
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.open(url, '_blank');
          } else {
            Alert.alert('Térkép', 'A térkép megnyitása nem sikerült.');
          }
        }}
        style={{ flex: 1 }}
        testID="web-map-open"
      >
        <Image
          source={{ uri: staticUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          accessibilityLabel="Térkép"
        />
      </TouchableOpacity>
      <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, paddingHorizontal: 16 }}>
        <Text
          style={{
            color: Colors.text,
            fontSize: 12,
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 8,
            borderRadius: 8,
          }}
        >
          {venues.length} helyszín • Kattints a térképre a böngészőben
        </Text>
      </View>
    </View>
  );
}