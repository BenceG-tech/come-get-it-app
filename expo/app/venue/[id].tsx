import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, useWindowDimensions, Platform, Linking, NativeScrollEvent, NativeSyntheticEvent, Animated, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Star, Clock, MapPin, ChevronDown, ChevronRight, Navigation, Heart, Martini } from 'lucide-react-native';
import { MapView, Marker } from '@/lib/mapComponents';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getVenueWithDetails } from '@/lib/supabaseProvider';
import { VenueWithDetails, VenueDrink } from '@/types/venue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OpeningHoursDisplay from '@/components/OpeningHoursDisplay';
import { convertOpeningHoursToBusinessHours, isVenueOpenNow, getClosingTimeToday } from '@/utils/openingHours';
import { geocodeVenueAddress } from '@/utils/geocoding';
import RedemptionWindowModal from '@/components/RedemptionWindowModal';
import { useFavorites } from '@/context/FavoritesContext';
import { getOfferAvailability, getConfiguredFreeDrinks, getDrinkOfferAvailability, getDrinkScheduleForDay, getVenueISODay } from '@/lib/offerAvailability';
import RemoteImage from '@/components/RemoteImage';
import { useAvailabilityNow } from '@/lib/useAvailabilityNow';
import { getCachedVenue } from '@/lib/venueData';
import { useLocation } from '@/context/LocationContext';
import { formatDistance, haversineMeters } from '@/utils/distance';


export default function VenueModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showHours, setShowHours] = useState<boolean>(false);
  const [descDrink, setDescDrink] = useState<VenueDrink | null>(null);

  const [venue, setVenue] = useState<VenueWithDetails | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState<boolean>(false);
  const [offersLoading, setOffersLoading] = useState(true);
  const [redemptionDrink, setRedemptionDrink] = useState<VenueDrink | null>(null);
  const venueRequest = useRef<AbortController | null>(null);
  const availabilityNow = useAvailabilityNow();
  const offerAvailability = getOfferAvailability(venue ?? {}, availabilityNow);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { location: userLocation } = useLocation();
  
  const scrollViewRef = useRef<ScrollView>(null);

  const glowPulse = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowPulse]);

  const fetchVenue = useCallback(async () => {
    venueRequest.current?.abort();
    const controller = new AbortController();
    venueRequest.current = controller;
    if (!id) {
      setError('Hiányzik a vendéglátóhely azonosítója.');
      setLoading(false);
      return;
    }
    const cached = getCachedVenue(String(id));
    setVenue(cached?.is_paused === true ? null : cached);
    setLoading(!cached);
    setOffersLoading(true);
    setError(null);
    const displayVenue = (next: VenueWithDetails) => {
      if (controller.signal.aborted) return;
      if (next.is_paused === true) {
        setVenue(null);
        setError('Ez a helyszín jelenleg nem elérhető.');
      } else {
        setVenue(next);
      }
      setLoading(false);
    };
    try {
      const next = await getVenueWithDetails(String(id), { signal: controller.signal, onBase: displayVenue });
      if (controller.signal.aborted) return;
      if (next) displayVenue(next);
      else setError('A vendéglátóhely nem található vagy jelenleg nem elérhető.');
    } catch (error) {
      if (!controller.signal.aborted) setError('A helyszín most nem tölthető be. Ellenőrizd a kapcsolatot, majd próbáld újra.');
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setOffersLoading(false); }
    }
  }, [id]);

  useEffect(() => {
    void fetchVenue();
    return () => venueRequest.current?.abort();
  }, [fetchVenue]);

  // Coordinates are optional page content. A slow geocoder never blocks the venue details.
  const latitude = venue?.coordinates?.lat ?? venue?.latitude;
  const longitude = venue?.coordinates?.lng ?? venue?.longitude;
  const venueAddress = venue?.address;
  const venueName = venue?.name;
  useEffect(() => {
    const valid = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      && latitude != null && longitude != null && !(Number(latitude) === 0 && Number(longitude) === 0);
    if (valid || !venueAddress || !venueName) { setGeocoding(false); return; }
    const controller = new AbortController();
    setGeocoding(true);
    void geocodeVenueAddress(venueName, venueAddress, controller.signal)
      .then((coordinates) => {
        if (!controller.signal.aborted && coordinates) setVenue((current) => current && current.id === id ? { ...current, coordinates } : current);
      })
      .finally(() => { if (!controller.signal.aborted) setGeocoding(false); });
    return () => controller.abort();
  }, [id, latitude, longitude, venueAddress, venueName]);

  const galleryImages = useMemo(() => {
    const arr: string[] = [];
    const fromDb = (venue?.images ?? []).filter((u) => typeof u === 'string' && u.trim().length > 0 && u.trim().length <= 2000);
    if (fromDb.length > 0) {
      arr.push(...fromDb);
    }
    if (venue?.hero_image_url) arr.push(venue.hero_image_url);
    if (venue?.image_url) arr.push(venue.image_url);
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const u of arr) {
      const t = u.trim();
      if (!seen.has(t)) { seen.add(t); uniq.push(t); }
    }
    return uniq.length > 0 ? uniq : [null];
  }, [venue?.images, venue?.hero_image_url, venue?.image_url]);

  const images = galleryImages;
  useEffect(() => { setActiveIndex(0); }, [id]);

  const freeDrinks = getConfiguredFreeDrinks(venue ?? {});
  const windowsNormalized = venue?.freeDrinkData?.windows ?? [];

  const resolvedCoords = useMemo(() => {
    const latRaw = (venue?.coordinates?.lat ?? venue?.latitude) as unknown;
    const lngRaw = (venue?.coordinates?.lng ?? venue?.longitude) as unknown;

    const lat = typeof latRaw === 'number' ? latRaw : typeof latRaw === 'string' ? Number(latRaw) : NaN;
    const lng = typeof lngRaw === 'number' ? lngRaw : typeof lngRaw === 'string' ? Number(lngRaw) : NaN;

    const isValid = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

    console.log('[VenueDetail] resolvedCoords:', {
      latRaw,
      lngRaw,
      lat,
      lng,
      isValid,
    });

    return {
      lat,
      lng,
      isValid,
    };
  }, [venue?.coordinates?.lat, venue?.coordinates?.lng, venue?.latitude, venue?.longitude]);

  const venueDistance = useMemo(() => {
    if (!userLocation || !resolvedCoords.isValid) return null;

    return haversineMeters(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      resolvedCoords.lat,
      resolvedCoords.lng,
    );
  }, [resolvedCoords, userLocation]);

  const [selectedDrinkIndex, setSelectedDrinkIndex] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(() => getVenueISODay());
  const venueIsFavorite = venue ? isFavorite(String(venue.id)) : false;

  const currentDrink = freeDrinks[selectedDrinkIndex] ?? freeDrinks[0] ?? null;

  const drinkAlwaysAvailable = currentDrink !== null && !windowsNormalized.some((window) => window.drinkId === currentDrink.id);
  const currentAvailability = currentDrink ? getDrinkOfferAvailability(venue ?? {}, currentDrink.id, availabilityNow) : offerAvailability;
  const ctaIsActive = currentAvailability.status === 'available' && currentDrink !== null;
  const ctaSubtitle = 'Most elérhető';

  const handleFavoritePress = useCallback(async () => {
    if (!venue?.id) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(String(venue.id));
  }, [toggleFavorite, venue?.id]);


  // ISO 8601: 1=Monday, 2=Tuesday, ..., 7=Sunday
  const dayLabels: { short: string; full: string }[] = [
    { short: 'H', full: 'Hétfő' },
    { short: 'K', full: 'Kedd' },
    { short: 'Sze', full: 'Szerda' },
    { short: 'Cs', full: 'Csütörtök' },
    { short: 'P', full: 'Péntek' },
    { short: 'Szo', full: 'Szombat' },
    { short: 'V', full: 'Vasárnap' },
  ];

  const getAvailabilityForDrink = (drinkId: string, isoDay: number) => getDrinkScheduleForDay(windowsNormalized, drinkId, isoDay);

  useEffect(() => {
    setSelectedDrinkIndex(0);
    setSelectedDay(getVenueISODay());
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Vendéglátóhely betöltése...</Text>
        </View>
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View style={[styles.container, styles.errorContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.errorTitle}>Nem sikerült megnyitni a helyszínt</Text>
        <Text style={styles.errorText}>{error || 'A vendéglátóhely nem található.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchVenue} testID="venue-detail-retry">
          <Text style={styles.retryButtonText}>Újrapróbálás</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLinkButton} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Vissza a helyszínekhez</Text>
        </TouchableOpacity>
      </View>
    );
  }


  console.log('[VenueDetail] Raw venue opening_hours:', JSON.stringify(venue?.opening_hours, null, 2));
  const businessHours = venue?.opening_hours ? convertOpeningHoursToBusinessHours(venue.opening_hours) : null;
  console.log('[VenueDetail] Converted businessHours:', JSON.stringify(businessHours, null, 2));
  const venueLike = businessHours ? { business_hours: businessHours } : null;
  const isOpen = venueLike ? isVenueOpenNow(venueLike) : false;
  const closingTime = venueLike ? getClosingTimeToday(venueLike) : null;
  console.log('[VenueDetail] isOpen:', isOpen, 'closingTime:', closingTime);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      testID="venue-detail-root"
    >
        {(() => {
          const heroHeight = Math.max(280, height * 0.45);
          const heroTransform = {
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [-heroHeight, 0, heroHeight],
                  outputRange: [-heroHeight / 2, 0, heroHeight * 0.5],
                }),
              },
              {
                scale: scrollY.interpolate({
                  inputRange: [-heroHeight, 0],
                  outputRange: [2, 1],
                  extrapolate: 'clamp',
                }),
              },
            ],
          };
          return (
        <Animated.ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false} 
          bounces={true}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={[styles.imageContainer, { height: heroHeight }]}>
            <Animated.View style={[StyleSheet.absoluteFill, heroTransform]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const index = Math.round(offsetX / width);
                  setActiveIndex(index);
                }}
                scrollEventThrottle={16}
                style={styles.imageScroller}
              >
                {images.map((uri, idx) => (
                  <RemoteImage
                    key={`img-${uri}-${idx}`}
                    testID={`venue-image-${idx}`}
                    uri={uri}
                    style={[styles.image, { width }]}
                    enabled={Math.abs(activeIndex - idx) <= 1}
                    priority={idx === activeIndex ? 'high' : 'low'}
                    accessibilityLabel={`${venue.name} fotója`}
                  />
                ))}
              </ScrollView>
            </Animated.View>
            {images.length > 1 && (
              <View style={styles.paginationDots}>
                {images.map((_, idx) => (
                  <View
                    key={`dot-${idx}`}
                    style={[
                      styles.dot,
                      activeIndex === idx && styles.dotActive
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.locationBadge}>
              <MapPin size={14} color={Colors.dark.text} />
              <Text style={styles.locationText}>Budapest</Text>
            </View>
            <View style={styles.venueNameOverlay}>
              <Text style={styles.venueNameOverlayText}>{venue.name}</Text>
            </View>
            {venueDistance !== null && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceTextBadge}>{formatDistance(venueDistance)}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.detailFavoriteButton}
              onPress={handleFavoritePress}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={venueIsFavorite ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}
              testID="venue-detail-favorite"
            >
              <Heart size={23} color="#00D1FF" fill={venueIsFavorite ? '#00D1FF' : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {venue.tags && venue.tags.length > 0 ? (
              <Text style={styles.tagsText}>
                {venue.tags.join(' • ')}
              </Text>
            ) : null}

            <View style={styles.pointsBar} testID="earn-points-card">
              <View style={styles.pointsBarIcon} testID="earn-points-icon">
                <Star size={16} color={Colors.dark.primary} fill={Colors.dark.primary} />
              </View>
              <View style={styles.pointsBarTextWrap} testID="earn-points-text">
                <Text style={styles.pointsBarTitle}>Szerezz pontokat</Text>
                <Text style={styles.pointsBarDesc} numberOfLines={1} ellipsizeMode="tail">Fogyasztás után pontok, jutalmakra válthatóan</Text>
              </View>
            </View>

            <Text style={styles.description}>{venue.description ?? ''}</Text>

            <TouchableOpacity style={styles.hoursSection} onPress={() => setShowHours(!showHours)} activeOpacity={0.7}>
              <View style={styles.hoursHeader}>
                <Clock size={16} color={Colors.dark.text} />
                <Text style={styles.hoursTitle}>
                  {businessHours ? (isOpen ? 'Nyitva' : 'Zárva') : 'Nyitvatartás'}
                </Text>
                {closingTime && isOpen && (
                  <Text style={styles.hoursTime}>Zárás {closingTime}</Text>
                )}
                <ChevronDown size={20} color={Colors.dark.text} style={[styles.chevron, showHours && styles.chevronUp]} />
              </View>
              {showHours && (
                <View style={styles.hoursDetails}>
                  <OpeningHoursDisplay 
                    businessHours={businessHours}
                    showStatus={false} 
                  />
                </View>
              )}
            </TouchableOpacity>

            {offersLoading ? <Text style={styles.emptyStateText}>Ajánlatok betöltése…</Text> : null}
            {!offersLoading && offerAvailability.status === 'unknown' ? (
              <TouchableOpacity onPress={fetchVenue} accessibilityRole="button">
                <Text style={styles.emptyStateText}>Az ajánlatok most nem ellenőrizhetők. Koppints az újrapróbáláshoz.</Text>
              </TouchableOpacity>
            ) : null}
            {freeDrinks.length > 0 ? <View style={styles.drinkSection}>
              <Text style={styles.drinkTitle}>Ingyen italok</Text>
              <Text testID="offer-current-status" style={styles.offerStatus}>
                {currentAvailability.status === 'available' ? 'Most beváltható' : currentAvailability.status === 'unknown' ? 'Az aktuális elérhetőség nem ellenőrizhető' : currentAvailability.reason === 'venue_closed' ? 'Most nem váltható be · A hely zárva' : 'Most nem váltható be'}
              </Text>
              {freeDrinks.length === 0 ? (
                <Text style={styles.emptyStateText}>Nincs elérhető ingyen ital.</Text>
              ) : (
                <View>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                      const offsetX = e.nativeEvent.contentOffset.x;
                      const index = Math.round(offsetX / width);
                      if (index !== selectedDrinkIndex && index >= 0 && index < freeDrinks.length) {
                        setSelectedDrinkIndex(index);
                        const newDrink = freeDrinks[index];
                        // Find first available ISO day (1-7) for new drink
                        for (let day = 1; day <= 7; day++) {
                          if (getAvailabilityForDrink(newDrink.id, day)) {
                            setSelectedDay(day);
                            return;
                          }
                        }
                        setSelectedDay(1);
                      }
                    }}
                    scrollEventThrottle={16}
                    style={styles.drinkCarousel}
                  >
                    {freeDrinks.map((drink, idx) => (
                      <View key={`drink-${drink.id}-${idx}`} style={[styles.drinkSlide, { width }]}>
                        <Pressable
                          style={styles.drinkImageContainer}
                          testID={`drink-image-${idx}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${drink.drinkName} leírása`}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setDescDrink(drink);
                          }}
                        >
                          {drink.imageUrl ? (
                            <RemoteImage
                              uri={drink.imageUrl}
                              style={styles.drinkMainImage}
                              enabled={Math.abs(selectedDrinkIndex - idx) <= 1}
                              accessibilityLabel={drink.drinkName}
                            />
                          ) : (
                            <View style={styles.drinkImagePlaceholder}>
                              <Text style={styles.drinkImagePlaceholderText}>🍺</Text>
                            </View>
                          )}
                          <View style={styles.drinkNameOverlay}>
                            <Text style={styles.drinkNameText}>{drink.drinkName}</Text>
                            <Text style={styles.drinkInfoHint}>Bökj a képre a részletekért</Text>
                          </View>
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>

                  {freeDrinks.length > 1 && (
                    <View style={styles.drinkPaginationDots}>
                      {freeDrinks.map((_, idx) => (
                        <View
                          key={`drink-dot-${idx}`}
                          style={[
                            styles.drinkDot,
                            selectedDrinkIndex === idx && styles.drinkDotActive
                          ]}
                        />
                      ))}
                    </View>
                  )}

                  <View style={styles.daySelectSection}>
                    {drinkAlwaysAvailable ? (
                      <View style={styles.anytimeBadge} testID="anytime-badge">
                        <Clock size={15} color={Colors.dark.primary} />
                        <Text style={styles.anytimeBadgeText}>Nyitvatartási időben beváltható</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.dayPillsRow}>
                          {dayLabels.map((day, index) => {
                            const isoDay = index + 1; // Convert to ISO 8601 (1-7)
                            const availability = currentDrink ? getAvailabilityForDrink(currentDrink.id, isoDay) : null;
                            const isAvailable = Boolean(availability);
                            const isSelected = selectedDay === isoDay;
                            return (
                              <Pressable
                                key={isoDay}
                                testID={`day-tab-${isoDay}`}
                                accessibilityRole="button"
                                accessibilityLabel={day.full}
                                accessibilityState={{ selected: isSelected }}
                                style={({ pressed }) => [
                                  styles.dayPill,
                                  !isAvailable && styles.dayPillDisabled,
                                  isSelected && styles.dayPillSelected,
                                  pressed && styles.dayPillPressed,
                                ]}
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setSelectedDay(isoDay);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                              >
                                <Text style={[
                                  styles.dayPillText,
                                  !isAvailable && styles.dayPillTextDisabled,
                                  isSelected && styles.dayPillTextSelected
                                ]}>
                                  {day.short}
                                </Text>
                                {isAvailable && !isSelected && <View style={styles.dayPillDot} />}
                              </Pressable>
                            );
                          })}
                        </View>
                        {currentDrink && (() => {
                          const availability = getAvailabilityForDrink(currentDrink.id, selectedDay);
                          const dayLabel = dayLabels[selectedDay - 1]?.full ?? '';
                          return availability ? (
                            <View style={styles.timeSlotRow}>
                              <Clock size={14} color={Colors.dark.primary} />
                              <Text testID="time-slot-text" style={styles.timeSlotRowText}>{`${dayLabel} ${availability}`}</Text>
                            </View>
                          ) : (
                            <Text testID="time-slot-text" style={styles.noTimeSlotRowText}>{`${dayLabel}: ezen a napon nincs italajánlat`}</Text>
                          );
                        })()}
                        <Text style={styles.scheduleNote}>Az ajánlat a hely nyitvatartása alatt váltható be.</Text>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View> : null}


            <View style={styles.mapSection}>
              {geocoding ? (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                  <Text style={styles.mapText}>Cím geokódolása...</Text>
                </View>
              ) : resolvedCoords.isValid ? (
                Platform.OS !== 'web' && MapView ? (
                  <View style={styles.mapContainer} testID="venue-map">
                    <MapView
                      style={styles.mapView}
                      initialRegion={{
                        latitude: resolvedCoords.lat,
                        longitude: resolvedCoords.lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      rotateEnabled={false}
                      pitchEnabled={false}
                      toolbarEnabled={false}
                      testID="venue-native-map"
                    >
                      <Marker
                        coordinate={{ latitude: resolvedCoords.lat, longitude: resolvedCoords.lng }}
                        title={venue.name}
                        onPress={() => {
                          const url = Platform.select({
                            ios: `maps:?daddr=${resolvedCoords.lat},${resolvedCoords.lng}&dirflg=d`,
                            android: `geo:${resolvedCoords.lat},${resolvedCoords.lng}?q=${resolvedCoords.lat},${resolvedCoords.lng}(${encodeURIComponent(venue.name)})`,
                            web: `https://www.google.com/maps/dir/?api=1&destination=${resolvedCoords.lat},${resolvedCoords.lng}`,
                            default: `https://www.google.com/maps/dir/?api=1&destination=${resolvedCoords.lat},${resolvedCoords.lng}`,
                          });
                          if (!url) return;
                          if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank');
                          else Linking.openURL(url).catch((err) => console.error('[VenueDetail] Failed to open maps:', err));
                        }}
                        testID="venue-native-marker"
                      />
                    </MapView>
                    <View style={styles.mapOverlay} pointerEvents="none">
                      <MapPin size={16} color="#fff" />
                      <Text style={styles.mapOverlayText}>Markerre bökve útvonal</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.mapContainer}
                    activeOpacity={0.9}
                    testID="venue-map"
                    onPress={() => {
                      const url = Platform.select({
                        ios: `maps:?daddr=${resolvedCoords.lat},${resolvedCoords.lng}&dirflg=d`,
                        android: `geo:${resolvedCoords.lat},${resolvedCoords.lng}?q=${resolvedCoords.lat},${resolvedCoords.lng}(${encodeURIComponent(venue.name)})`,
                        web: `https://www.google.com/maps/search/?api=1&query=${resolvedCoords.lat},${resolvedCoords.lng}`,
                        default: `https://www.google.com/maps/search/?api=1&query=${resolvedCoords.lat},${resolvedCoords.lng}`,
                      });
                      if (url) {
                        if (Platform.OS === 'web' && typeof window !== 'undefined') {
                          window.open(url, '_blank');
                        } else {
                          Linking.openURL(url).catch((err) => {
                            console.error('[VenueDetail] Failed to open maps:', err);
                          });
                        }
                      }
                    }}
                  >
                    <Image
                      source={{
                        uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${resolvedCoords.lat},${resolvedCoords.lng}&zoom=16&size=900x420&maptype=mapnik&markers=${resolvedCoords.lat},${resolvedCoords.lng},lightblue1`,
                      }}
                      style={styles.mapView}
                      resizeMode="cover"
                      onError={(e) => console.log('[VenueDetail] Map image failed to load:', e.nativeEvent.error)}
                    />
                    <View style={styles.mapOverlay}>
                      <MapPin size={16} color="#fff" />
                      <Text style={styles.mapOverlayText}>Kattints a térképhez</Text>
                    </View>
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity
                  style={[styles.mapContainer, styles.mapFallbackArtwork]}
                  activeOpacity={0.9}
                  testID="venue-map-address-fallback"
                  onPress={() => {
                    const query = encodeURIComponent(`${venue.name} ${venue.address ?? ''}`.trim());
                    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      window.open(url, '_blank');
                    } else {
                      Linking.openURL(url).catch((err) => console.error('[VenueDetail] Failed to open address search:', err));
                    }
                  }}
                >
                  <View style={[styles.mapGridLine, styles.mapGridLineVerticalOne]} />
                  <View style={[styles.mapGridLine, styles.mapGridLineVerticalTwo]} />
                  <View style={[styles.mapGridLine, styles.mapGridLineHorizontalOne]} />
                  <View style={[styles.mapGridLine, styles.mapGridLineHorizontalTwo]} />
                  <View style={[styles.mapRoad, styles.mapRoadPrimary]} />
                  <View style={[styles.mapRoad, styles.mapRoadSecondary]} />
                  <View style={styles.mapPinBubble}>
                    <MapPin size={34} color="#FFFFFF" />
                  </View>
                  <View style={styles.mapOverlay}>
                    <MapPin size={16} color="#fff" />
                    <Text style={styles.mapOverlayText}>Cím keresése térképen</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.directionsButton} 
                testID="show-on-map-button" 
                accessibilityRole="button" 
                accessibilityLabel="Útvonaltervezés"
                onPress={() => {
                  if (resolvedCoords.isValid) {
                    const url = Platform.select({
                      ios: `maps:?daddr=${resolvedCoords.lat},${resolvedCoords.lng}&dirflg=d`,
                      android: `geo:${resolvedCoords.lat},${resolvedCoords.lng}?q=${resolvedCoords.lat},${resolvedCoords.lng}(${encodeURIComponent(venue.name)})`,
                      web: `https://www.google.com/maps/dir/?api=1&destination=${resolvedCoords.lat},${resolvedCoords.lng}`,
                      default: `https://www.google.com/maps/dir/?api=1&destination=${resolvedCoords.lat},${resolvedCoords.lng}`,
                    });
                    if (url) {
                      if (Platform.OS === 'web') {
                        window.open(url, '_blank');
                      } else {
                        Linking.openURL(url).catch(err => {
                          console.error('[VenueDetail] Failed to open maps:', err);
                        });
                      }
                    }
                  } else {
                    console.warn('[VenueDetail] No coordinates available for directions');
                  }
                }}
              >
                <View style={styles.directionsIcon}>
                  <Navigation size={17} color="#001014" />
                </View>
                <Text style={styles.directionsText}>Útvonaltervezés</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
          );
        })()}

        {ctaIsActive ? <View
          style={[styles.bottomCarousel, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}
          pointerEvents="box-none"
        >
          <View style={styles.ctaWrap}>
            {ctaIsActive && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.ctaGlow,
                  { opacity: glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] }) },
                ]}
              />
            )}
            <Pressable
              testID="free-drink-cta"
              accessibilityRole="button"
              accessibilityLabel="Kérd ingyen italod"
              style={({ pressed }) => [
                styles.ctaButton,
                !ctaIsActive && styles.ctaButtonInactive,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (!currentDrink || !getOfferAvailability(venue).drinkIds.includes(currentDrink.id)) return;
                setRedemptionDrink(currentDrink);
                setShowRedeemModal(true);
              }}
            >
              <View style={[styles.ctaIcon, !ctaIsActive && styles.ctaIconInactive]}>
                <Martini size={20} color={ctaIsActive ? '#001014' : 'rgba(255,255,255,0.55)'} />
              </View>
              <View style={styles.ctaTextWrap}>
                <Text style={[styles.ctaTitle, !ctaIsActive && styles.ctaTitleInactive]}>Kérd ingyen italod</Text>
                <Text style={[styles.ctaSubtitle, !ctaIsActive && styles.ctaSubtitleInactive]} numberOfLines={1}>{ctaSubtitle}</Text>
              </View>
              <ChevronRight size={18} color={ctaIsActive ? '#00D1FF' : 'rgba(255,255,255,0.4)'} />
            </Pressable>
          </View>
        </View> : null}

      <Modal
        visible={descDrink !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDescDrink(null)}
      >
        <Pressable style={styles.descOverlay} onPress={() => setDescDrink(null)}>
          <Pressable style={styles.descCard} onPress={() => {}} testID="drink-description-card">
            <View style={styles.descImageWrap}>
              {descDrink?.imageUrl ? (
                <RemoteImage uri={descDrink.imageUrl} style={styles.descImage} accessibilityLabel={descDrink.drinkName} />
              ) : (
                <View style={[styles.descImage, styles.descImageFallback]}>
                  <Text style={styles.drinkImagePlaceholderText}>🍸</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.descCloseButton}
                onPress={() => setDescDrink(null)}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                testID="drink-description-close"
              >
                <X size={19} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.descBody}>
              <View style={styles.descBadge}>
                <Martini size={12} color="#001014" />
                <Text style={styles.descBadgeText}>Ingyen ital</Text>
              </View>
              <Text style={styles.descTitle}>{descDrink?.drinkName ?? ''}</Text>
              <Text style={styles.descText}>
                {descDrink?.description ?? 'Ehhez az italhoz még nincs részletes leírás. Hamarosan itt találod az összetevőket és az ital történetét.'}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <RedemptionWindowModal
        visible={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        venueId={venue.id}
        venueName={venue.name}
        venueCoordinates={resolvedCoords.isValid ? { latitude: resolvedCoords.lat, longitude: resolvedCoords.lng } : null}
        drink={redemptionDrink}
        freeDrinkWindows={windowsNormalized}
      />
    </View>
  );
}




const styles = StyleSheet.create({
  offerStatus: { color: '#ADB9BD', fontSize: 14, marginBottom: 16 },
  scheduleNote: { color: '#8F999D', fontSize: 12, marginTop: 10, textAlign: 'center' },
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  errorTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.dark.subtext,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    minHeight: 48,
    minWidth: 180,
    marginTop: 24,
    paddingHorizontal: 22,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
  },
  retryButtonText: {
    color: '#001014',
    fontSize: 15,
    fontWeight: '900',
  },
  backLinkButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backLinkText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    fontWeight: '700',
  },
  imageContainer: {
    position: 'relative',
  },

  imageScroller: {
    flex: 1,
  },
  image: {
    height: '100%',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: Colors.dark.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailFavoriteButton: {
    position: 'absolute',
    top: 16,
    right: 64,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 7,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceTextBadge: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  distanceText: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 16,
  },
  content: {
    padding: 20,
    backgroundColor: Colors.dark.background,
  },
  venueNameOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '70%',
  },
  venueNameOverlayText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  earnPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  earnPointsText: {
    color: Colors.dark.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  venueCategory: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: 16,
  },
  description: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  hoursSection: {
    marginBottom: 20,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 'auto',
    transform: [{ rotate: '0deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  hoursTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  hoursTime: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginLeft: 'auto',
  },
  drinkSection: {
    marginBottom: 20,
    zIndex: 5,
  },
  drinkTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyStateText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  drinkCarousel: {
    marginHorizontal: -20,
  },
  drinkSlide: {
    paddingHorizontal: 20,
  },
  drinkImageContainer: {
    position: 'relative',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  drinkPaginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  drinkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  drinkDotActive: {
    backgroundColor: Colors.dark.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  drinkMainImage: {
    width: '100%',
    height: '100%',
  },
  drinkImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drinkImagePlaceholderText: {
    fontSize: 80,
  },
  drinkNameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  drinkNameText: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  drinkInfoHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 3,
  },
  descOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  descCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: '#0A161B',
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 14,
  },
  descImageWrap: {
    height: 190,
    backgroundColor: '#050709',
  },
  descImage: {
    width: '100%',
    height: '100%',
  },
  descImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 209, 255, 0.07)',
  },
  descCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descBody: {
    padding: 18,
    gap: 8,
  },
  descBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#00D1FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  descBadgeText: {
    color: '#001014',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  descTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  descText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 21,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 42,
    minHeight: 44,
  },
  dayTabSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  dayTabDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dayTabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  dayTabText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTabTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  dayTabTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  timeSlotDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  timeSlotText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  noTimeSlotDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noTimeSlotText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  ingredientsTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ingredientsText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    lineHeight: 20,
  },

  mapSection: {
    marginBottom: 140,
    paddingBottom: 24,
  },
  daySelectSection: {
    marginTop: 8,
    zIndex: 10,
  },
  dayTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
  mapView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapFallbackArtwork: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171C1F',
  },
  mapGridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mapGridLineVerticalOne: {
    top: -20,
    bottom: -20,
    left: '28%',
    width: 2,
    transform: [{ rotate: '12deg' }],
  },
  mapGridLineVerticalTwo: {
    top: -24,
    bottom: -24,
    right: '24%',
    width: 2,
    transform: [{ rotate: '-9deg' }],
  },
  mapGridLineHorizontalOne: {
    left: -20,
    right: -20,
    top: '34%',
    height: 2,
    transform: [{ rotate: '-5deg' }],
  },
  mapGridLineHorizontalTwo: {
    left: -20,
    right: -20,
    bottom: '26%',
    height: 2,
    transform: [{ rotate: '8deg' }],
  },
  mapRoad: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  mapRoadPrimary: {
    width: '118%',
    height: 22,
    transform: [{ rotate: '-18deg' }],
  },
  mapRoadSecondary: {
    width: '82%',
    height: 14,
    transform: [{ rotate: '34deg' }],
    backgroundColor: 'rgba(43,183,255,0.20)',
  },
  mapPinBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#2BB7FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  mapText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 8,
  },
  mapSubtext: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginTop: 4,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  directionsButton: {
    backgroundColor: '#0A161B',
    height: 54,
    paddingVertical: 0,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 209, 255, 0.5)',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  directionsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  claimButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  claimButtonText: {
    color: Colors.dark.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  earnPointsContent: {
    backgroundColor: Colors.accentEarn,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    minHeight: 72,
  },
  tagsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  earnPointsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earnPointsLabelText: {
    color: Colors.dark.primary,
    fontSize: 14,
  },
  tagsText: {
    color: '#AAAAAA',
    fontSize: 14,
    flex: 1,
  },
  earnPointsIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  earnPointsStarImage: {
    width: 56,
    height: 56,
  },
  earnPointsTextContainer: {
    flex: 1,
  },
  earnPointsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  earnPointsDescription: {
    color: '#CFEAEC',
    fontSize: 12,
    lineHeight: 16,
  },
  hoursDetails: {
    marginTop: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hoursDay: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  bottomCarousel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 56,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 0,
    paddingTop: 12,
    zIndex: 100,
  },
  ctaWrap: {
    marginHorizontal: 20,
    position: 'relative',
  },
  ctaGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#00D1FF',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaButton: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: '#0A161B',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 209, 255, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaButtonInactive: {
    borderColor: 'rgba(255,255,255,0.14)',
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: '#0C1114',
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  ctaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00D1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaIconInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  ctaTitleInactive: {
    color: 'rgba(255,255,255,0.75)',
  },
  ctaSubtitle: {
    color: '#00D1FF',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 1,
  },
  ctaSubtitleInactive: {
    color: 'rgba(255,255,255,0.42)',
    fontWeight: '600',
  },
  pointsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(0, 209, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.22)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 22,
  },
  pointsBarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 209, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsBarTextWrap: {
    flex: 1,
    gap: 3,
  },
  pointsBarTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pointsBarDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12.5,
    lineHeight: 17,
  },
  anytimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 209, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.35)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  anytimeBadgeText: {
    color: '#00D1FF',
    fontSize: 13,
    fontWeight: '800',
  },
  dayPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  dayPill: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  dayPillSelected: {
    backgroundColor: '#00D1FF',
    borderColor: '#00D1FF',
  },
  dayPillDisabled: {
    backgroundColor: 'transparent',
  },
  dayPillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  dayPillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    fontWeight: '700',
  },
  dayPillTextSelected: {
    color: '#001014',
    fontWeight: '900',
  },
  dayPillTextDisabled: {
    color: '#8F999D',
  },
  dayPillDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00D1FF',
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  timeSlotRowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  noTimeSlotRowText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12.5,
    fontStyle: 'italic',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  carouselCard: {
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: 'rgba(255,255,255,0.6)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
    marginHorizontal: 20,
  },
  carouselContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  carouselIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselIconText: {
    fontSize: 22,
  },
  carouselTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },

  carouselArrow: {
    marginRight: 4,
    color: '#FFFFFF',
  },
  carouselCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
