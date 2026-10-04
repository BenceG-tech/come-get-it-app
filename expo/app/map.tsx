import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { ArrowLeft, Search, MapPin, Navigation, AlertCircle, CheckCircle2, Crosshair } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Venue } from '@/types/venue';
import { fetchVenues } from '@/lib/venueService';
import DarkMapPreview, { resolveVenueCoordinate } from '@/components/DarkMapPreview';
import { MapView, Marker, PROVIDER_DEFAULT } from '@/lib/mapComponents';
import VenueMiniCard from '@/components/VenueMiniCard';
import { useLocation } from '@/context/LocationContext';
import { formatDistance, haversineMeters } from '@/utils/distance';

export default function MapScreen() {
  const router = useRouter();
  const statusBarStyle = 'light' as const;
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [previewVenue, setPreviewVenue] = useState<Venue | null>(null);

  const {
    location: userLocation,
    locationStatus,
    getCurrentLocation,
    startWatching,
    stopWatching,
    requestPermission,
    openLocationSettings,
  } = useLocation();

  // Start watching position on mount; stop on unmount.
  useEffect(() => {
    startWatching();
    return () => stopWatching();
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
    const controller = new AbortController();
    const display = (rows: Venue[]) => {
      if (controller.signal.aborted) return;
      // Venue Hub owns coordinates; missing map data must not delay the venue list.
      setVenues(rows.map((venue) => ({ ...venue,
        latitude: venue.coordinates?.lat ?? venue.latitude,
        longitude: venue.coordinates?.lng ?? venue.longitude,
      })));
      setLoading(false);
      setLoadError(false);
    };
    void fetchVenues({ orderByCreated: true, signal: controller.signal, onBase: display })
      .then(display)
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
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
          centerOnUser={locationStatus === 'found'}
          locationStatus={locationStatus}
          onRecenter={async () => {
            if (locationStatus === 'denied' || locationStatus === 'idle') {
              const granted = await requestPermission();
              if (granted) await startWatching();
            } else {
              await getCurrentLocation();
            }
          }}
          onOpenSettings={openLocationSettings}
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
  locationStatusBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 12,
    zIndex: 50,
  },
  locationStatusText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
  },
  locationStatusAction: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#00D1FF',
  },
  locationStatusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: -4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 209, 255, 0.12)',
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
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
  centerOnUser,
  locationStatus,
  onRecenter,
  onOpenSettings,
}: {
  venues: Venue[];
  loadError: boolean;
  router: ReturnType<typeof useRouter>;
  previewVenue: Venue | null;
  onMarkerPress: (venue: Venue) => void;
  onClosePreview: () => void;
  onDetails: (venue: Venue) => void;
  userCoordinate: { latitude: number; longitude: number } | null;
  centerOnUser: boolean;
  locationStatus: 'idle' | 'locating' | 'found' | 'denied' | 'unavailable';
  onRecenter: () => Promise<void>;
  onOpenSettings: () => Promise<void>;
}) {
  const nativeMapRef = useRef<{
    animateToRegion?: (
      region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number },
      duration?: number
    ) => void;
  } | null>(null);

  const initialNativeRegion = useMemo(() => {
    const center = userCoordinate ?? { latitude: 47.4979, longitude: 19.0402 };
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: 0.11,
      longitudeDelta: 0.11,
    };
  }, [userCoordinate]);

  useEffect(() => {
    if (!centerOnUser || !userCoordinate || !nativeMapRef.current?.animateToRegion) return;
    nativeMapRef.current.animateToRegion(
      {
        latitude: userCoordinate.latitude,
        longitude: userCoordinate.longitude,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      },
      450
    );
  }, [centerOnUser, userCoordinate]);

  const statusConfig = {
    idle: { text: 'Helymeghatározás inaktív', icon: Crosshair, color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.08)' },
    locating: { text: 'Helymeghatározás folyamatban…', icon: Navigation, color: '#00D1FF', bg: 'rgba(0,209,255,0.10)' },
    found: { text: 'Helyzet megtalálva', icon: CheckCircle2, color: '#22C55E', bg: 'rgba(34,197,94,0.10)' },
    denied: { text: 'Nincs engedély — koppints az engedélyezéshez', icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
    unavailable: { text: 'Helymeghatározás nem elérhető', icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
  } as const;

  const status = statusConfig[locationStatus];
  const StatusIcon = status.icon;

  return (
    <View style={styles.webMapContainer} testID="dark-map">
      {Platform.OS === 'ios' && MapView ? (
        <MapView
          ref={nativeMapRef}
          style={styles.webMapCanvas}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialNativeRegion}
          mapType="mutedStandard"
          userInterfaceStyle="dark"
          showsUserLocation={locationStatus === 'found'}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          testID="native-apple-map"
        >
          {venues.map((venue) => {
            const coordinate = resolveVenueCoordinate(venue);
            if (coordinate.approximate) return null;
            return (
              <Marker
                key={String(venue.id)}
                coordinate={{ latitude: coordinate.latitude, longitude: coordinate.longitude }}
                title={venue.name}
                description={venue.address ?? undefined}
                pinColor="#00D1FF"
                onPress={() => onMarkerPress(venue)}
                testID={`map-marker-${String(venue.id)}`}
              />
            );
          })}
        </MapView>
      ) : (
        <DarkMapPreview
          venues={venues}
          zoom={13}
          style={styles.webMapCanvas}
          interactive
          controlsBottomOffset={24}
          userCoordinate={userCoordinate}
          centerOnUser={centerOnUser}
          onMarkerPress={(venue) => {
            console.log('[Map] Map marker pressed, showing mini card:', venue.id);
            onMarkerPress(venue);
          }}
        />
      )}

      {/* Location status bar */}
      <View style={[styles.locationStatusBar, { backgroundColor: status.bg }]} pointerEvents="box-none" testID="map-location-status">
        <StatusIcon size={15} color={status.color} />
        <Text style={[styles.locationStatusText, { color: status.color }]}>{status.text}</Text>
        {(locationStatus === 'denied' || locationStatus === 'idle' || locationStatus === 'unavailable') && (
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.locationStatusButton}
            onPress={() => {
              console.log('[Map] Location action pressed, status:', locationStatus);
              if (locationStatus === 'denied') {
                onOpenSettings();
              } else if (locationStatus === 'idle' || locationStatus === 'unavailable') {
                onRecenter();
              }
            }}
            testID="map-location-action"
          >
            <Text style={styles.locationStatusAction}>{locationStatus === 'denied' ? 'Beállítások' : 'Engedélyezés'}</Text>
          </TouchableOpacity>
        )}
      </View>

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
          venue={venues.find((venue) => venue.id === previewVenue.id) ?? previewVenue}
          onClose={onClosePreview}
          onDetails={onDetails}
          bottomOffset={24}
          testID="map-venue-mini-card"
        />
      )}
    </View>
  );
}
