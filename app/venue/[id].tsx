import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, useWindowDimensions, Platform, Linking, NativeScrollEvent, NativeSyntheticEvent, Animated, PanResponder, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Star, Clock, MapPin, ChevronDown, ChevronRight, Navigation } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getVenueWithDetails } from '@/lib/supabaseProvider';
import { VenueWithDetails, VenueDrink } from '@/types/venue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OpeningHoursDisplay from '@/components/OpeningHoursDisplay';
import { convertOpeningHoursToBusinessHours, isVenueOpenNow, getClosingTimeToday } from '@/utils/openingHours';
import RedeemQRModal from '@/components/RedeemQRModal';


function getTodayISODay(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}



export default function VenueModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showHours, setShowHours] = useState<boolean>(false);

  const [venue, setVenue] = useState<VenueWithDetails | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState<boolean>(false);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);
  const [scrollY, setScrollY] = useState<number>(0);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Only capture vertical swipes when at top of scroll and swiping down significantly
        return scrollY <= 0 && Math.abs(dy) > Math.abs(dx) && dy > 20;
      },
      onPanResponderGrant: () => {
        setScrollEnabled(false);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0 && scrollY <= 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setScrollEnabled(true);
        if (gestureState.dy > height * 0.2) {
          Animated.timing(translateY, {
            toValue: height,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const fetchVenue = async () => {
      if (!id) {
        setError('No venue ID provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        console.info('[VenueDetail] Loading venue', id);
        let v = await getVenueWithDetails(String(id));
        if (!v) {
          setError('Venue not found');
          return;
        }
        console.info('[VenueDetail] Venue loaded with opening_hours:', v?.opening_hours);
        
        // Geocode if no coordinates
        if ((!v.latitude || !v.longitude) && v.address) {
          setGeocoding(true);
          try {
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(v.address + ', Budapest, Hungary')}&limit=1`;
            const geocodeResponse = await fetch(geocodeUrl, {
              headers: {
                'User-Agent': 'RorkApp/1.0'
              }
            });
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData && geocodeData.length > 0) {
              const lat = parseFloat(geocodeData[0].lat);
              const lon = parseFloat(geocodeData[0].lon);
              console.log(`[VenueDetail] Geocoded ${v.name}: ${lat}, ${lon}`);
              
              // Update venue in database
              const { rest } = await import('@/lib/supabaseRest');
              await rest(`/venues?id=eq.${v.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon })
              });
              
              v = { ...v, latitude: lat, longitude: lon };
            }
          } catch (geocodeError) {
            console.error(`[VenueDetail] Failed to geocode:`, geocodeError);
          } finally {
            setGeocoding(false);
          }
        }
        
        setVenue(v);
      } catch (e) {
        console.error('[VenueDetail] Failed to load', e);
        setError('Failed to load venue');
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [id]);

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
    return uniq.length > 0 ? uniq : ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200'];
  }, [venue]);

  useEffect(() => {
    setImages(galleryImages);
    setActiveIndex(0);
  }, [galleryImages]);

  const onImageError = useCallback((index: number) => {
    setImages((prev) => {
      if (!prev || index < 0 || index >= prev.length) return prev;
      const next = [...prev];
      next[index] = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200';
      return next;
    });
  }, []);

  const freeDrinks: VenueDrink[] = useMemo(() => {
    const drinks = (venue?.drinks ?? []).filter((d) => d.isFreeDrink);
    console.log('[VenueDetail] Free drinks:', drinks.length, drinks.map(d => d.drinkName));
    return drinks;
  }, [venue]);

  const windowsNormalized = useMemo(() => {
    const freeDrinkWindows = venue?.freeDrinkWindows ?? [];
    const mapped = freeDrinkWindows.map(w => ({ ...w }));
    console.log('[VenueDetail] Windows (no normalization applied):', mapped);
    return mapped;
  }, [venue?.freeDrinkWindows]);

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

  const [selectedDrinkIndex, setSelectedDrinkIndex] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(() => getTodayISODay());

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

  const getAvailabilityForDrink = useCallback((drinkId: string, isoDay: number): string | null => {
    const dbDayIndex = isoDay - 1;

    console.log(`[VenueDetail] getAvailabilityForDrink: drinkId=${drinkId}, isoDay=${isoDay}, dbDayIndex=${dbDayIndex}`);
    console.log(`[VenueDetail] Total windows: ${windowsNormalized.length}`);

    const matchingWindows = windowsNormalized.filter((w) => {
      const drinkMatches = String(w.drinkId) === String(drinkId);

      const daysMatches = Array.isArray(w.days) && w.days.includes(isoDay);
      const legacyMatches = typeof w.dayOfWeek === 'number' && w.dayOfWeek === dbDayIndex;

      const dayMatches = daysMatches || legacyMatches;

      console.log(
        `[VenueDetail] Checking window: drinkMatches=${drinkMatches} dayMatches=${dayMatches} days=${JSON.stringify(w.days)} dayOfWeek=${w.dayOfWeek} isoDay=${isoDay}`
      );

      return drinkMatches && dayMatches;
    });

    console.log(`[VenueDetail] Found ${matchingWindows.length} matching windows for isoDay ${isoDay}`);

    if (matchingWindows.length === 0) return null;

    return matchingWindows
      .map((w) => {
        const start = (w.start ?? '').toString();
        const end = (w.end ?? '').toString();
        const s = start.includes(':') ? start.substring(0, 5) : start;
        const e = end.includes(':') ? end.substring(0, 5) : end;
        return `${s}-${e}`;
      })
      .join(', ');
  }, [windowsNormalized]);


  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading venue...</Text>
        </View>
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
        <Text style={[styles.loadingText, { color: 'red' }]}>{error || 'Venue not found'}</Text>
        <TouchableOpacity style={styles.directionsButton} onPress={() => router.back()}>
          <Text style={styles.directionsText}>Back</Text>
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
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={true}
      onRequestClose={() => router.back()}
>
      <Animated.View 
        style={[
          styles.container, 
          { 
            paddingTop: insets.top, 
            paddingBottom: insets.bottom,
            transform: [{ translateY }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false} 
          bounces={false}
          scrollEnabled={scrollEnabled}
          onScroll={(e) => {
            setScrollY(e.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
        >
          <View style={[styles.imageContainer, { height: Math.max(280, height * 0.45) }]}>
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
                <Image
                  key={`img-${uri}-${idx}`}
                  testID={`venue-image-${idx}`}
                  source={{ uri }}
                  style={[styles.image, { width }]}
                  resizeMode="cover"
                  onError={() => onImageError(idx)}
                />
              ))}
            </ScrollView>
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
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceTextBadge}>{venue.distance ? (venue.distance / 1000).toFixed(1) : '0.5'}km</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.tagsSection}>
              <View style={styles.earnPointsLabel}>
                <Star size={16} color={Colors.dark.primary} fill={Colors.dark.primary} />
                <Text style={styles.earnPointsLabelText}>Szerezz pontokat</Text>
              </View>
              {venue.tags && venue.tags.length > 0 ? (
                <Text style={styles.tagsText}>
                  {venue.tags.join(' • ')}
                </Text>
              ) : null}
            </View>

            <View style={styles.earnPointsContent} testID="earn-points-card">
              <View style={styles.earnPointsIconGroup} testID="earn-points-icon">
                <Image 
                  source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3a1fkjr5hx679da6zl8hz" }}
                  style={styles.earnPointsStarImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.earnPointsTextContainer} testID="earn-points-text">
                <Text style={styles.earnPointsTitle}>SZEREZZ PONTOKAT</Text>
                <Text style={styles.earnPointsDescription} numberOfLines={2} ellipsizeMode="tail">Ha itt fogyasztasz, gyűlnek a pontjaid, melyeket értékes jutalmakra válthatsz.</Text>
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

            <View style={styles.drinkSection}>
              <Text style={styles.drinkTitle}>Ingyen italok</Text>
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
                        <View style={styles.drinkImageContainer}>
                          {drink.imageUrl ? (
                            <Image 
                              source={{ uri: drink.imageUrl }} 
                              style={styles.drinkMainImage} 
                              resizeMode="cover" 
                            />
                          ) : (
                            <View style={styles.drinkImagePlaceholder}>
                              <Text style={styles.drinkImagePlaceholderText}>🍺</Text>
                            </View>
                          )}
                          <View style={styles.drinkNameOverlay}>
                            <Text style={styles.drinkNameText}>{drink.drinkName}</Text>
                          </View>
                        </View>
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
                    <View style={styles.dayTabsRow}>
                      {dayLabels.map((day, index) => {
                        const isoDay = index + 1; // Convert to ISO 8601 (1-7)
                        const currentDrink = freeDrinks[selectedDrinkIndex];
                        const availability = currentDrink ? getAvailabilityForDrink(currentDrink.id, isoDay) : null;
                        const isAvailable = Boolean(availability);
                        const isSelected = selectedDay === isoDay;
                        return (
                          <Pressable
                            key={isoDay}
                            testID={`day-tab-${isoDay}`}
                            disabled={!isAvailable}
                            style={({ pressed }) => [
                              styles.dayTab,
                              isSelected && styles.dayTabSelected,
                              !isAvailable && styles.dayTabDisabled,
                              pressed && isAvailable && styles.dayTabPressed,
                            ]}
                            onPress={() => {
                              if (!isAvailable) return;
                              console.log(`[VenueDetail] Day tab pressed: ${day.full} (ISO ${isoDay}), availability: ${availability}`);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedDay(isoDay);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                          >
                            <Text style={[
                              styles.dayTabText,
                              isSelected && styles.dayTabTextSelected,
                              !isAvailable && styles.dayTabTextDisabled
                            ]}>
                              {day.short}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {freeDrinks[selectedDrinkIndex] && (() => {
                      const currentDrink = freeDrinks[selectedDrinkIndex];
                      const availability = getAvailabilityForDrink(currentDrink.id, selectedDay);
                      const dayLabel = dayLabels[selectedDay - 1]?.full ?? '';
                      return availability ? (
                        <View style={styles.timeSlotDisplay}>
                          <Clock size={16} color={Colors.dark.primary} />
                          <Text testID="time-slot-text" style={styles.timeSlotText}>{`${dayLabel} ${availability}`}</Text>
                        </View>
                      ) : (
                        <View style={styles.noTimeSlotDisplay}>
                          <Text style={styles.noTimeSlotText}>Ezen a napon nincs elérhető idősáv</Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.mapSection}>
              {geocoding ? (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                  <Text style={styles.mapText}>Cím geokódolása...</Text>
                </View>
              ) : resolvedCoords.isValid ? (
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
                        Linking.openURL(url).catch(err => {
                          console.error('[VenueDetail] Failed to open maps:', err);
                        });
                      }
                    }
                  }}
                >
                  <Image
                    source={{ 
                      uri: `https://maps.geoapify.com/v1/staticmap?style=dark-matter&width=800&height=400&center=lonlat:${resolvedCoords.lng},${resolvedCoords.lat}&zoom=15&marker=lonlat:${resolvedCoords.lng},${resolvedCoords.lat};color:%232BB7FF;size:large&apiKey=6dc7fb95a3b246cfa0f3bcef5ce9ed9a`
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
              ) : (
                <View style={styles.mapPlaceholder}>
                  <MapPin size={24} color={Colors.dark.text} />
                  <Text style={styles.mapText}>Térkép</Text>
                  <Text style={styles.mapSubtext}>{venue.address}</Text>
                </View>
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
                <Navigation size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.directionsText}>Útvonaltervezés</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View 
          style={[styles.bottomCarousel, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}
          pointerEvents="box-none"
        >
          <Pressable 
            style={({ pressed }) => [
              styles.carouselCard,
              pressed && styles.carouselCardPressed,
            ]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowRedeemModal(true);
            }}
          >
            <View style={styles.carouselContent}>
              <View style={styles.carouselIcon}>
                <Text style={styles.carouselIconText}>🍺</Text>
              </View>
              <View>
                <Text style={styles.carouselTitle}>Kérd ingyen italod</Text>
                <Text style={styles.carouselSubtitle}>Most elérhető</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#FFFFFF" style={styles.carouselArrow} />
          </Pressable>
        </View>
      </Animated.View>

      <RedeemQRModal
        visible={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        venueId={venue.id}
        venueName={venue.name}
        drink={freeDrinks[selectedDrinkIndex] ?? null}
        freeDrinkWindows={windowsNormalized}
      />
    </Modal>
  );
}




const styles = StyleSheet.create({
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
    backgroundColor: Colors.accentEarn,
    height: 46,
    paddingVertical: 0,
    justifyContent: 'center',
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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