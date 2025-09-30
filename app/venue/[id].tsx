import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, useWindowDimensions, ImageBackground, Platform, Linking, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Star, Clock, MapPin, ChevronDown, ChevronRight, Navigation } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getVenueWithDetails } from '@/lib/supabaseProvider';
import { VenueWithDetails, VenueDrink } from '@/types/venue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OpeningHoursDisplay from '@/components/OpeningHoursDisplay';
import { convertOpeningHoursToBusinessHours, isVenueOpenNow, getClosingTimeToday } from '@/utils/openingHours';


const placeholder = require('../../assets/images/splash-icon.png');



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
  const freeDrinkWindows = venue?.freeDrinkWindows ?? [];
  const [selectedDrinkIndex, setSelectedDrinkIndex] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  
  useEffect(() => {
    console.log('[VenueDetail] Venue drinks:', venue?.drinks?.length ?? 0);
    console.log('[VenueDetail] All drinks:', venue?.drinks?.map(d => ({ name: d.drinkName, isFree: d.isFreeDrink })));
    console.log('[VenueDetail] Free drink windows:', freeDrinkWindows.length);
  }, [venue, freeDrinkWindows]);

  const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  const dayNamesShort = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

  const getAvailabilityForDrink = (drinkId: string, dayOfWeek: number): string | null => {
    console.log(`[VenueDetail] getAvailabilityForDrink - drinkId: ${drinkId}, dayOfWeek: ${dayOfWeek}`);
    console.log(`[VenueDetail] All windows:`, freeDrinkWindows.map(w => ({ drinkId: w.drinkId, dayOfWeek: w.dayOfWeek, start: w.start, end: w.end })));
    const windows = freeDrinkWindows.filter((w) => w.drinkId === drinkId && w.dayOfWeek === dayOfWeek);
    console.log(`[VenueDetail] Filtered windows for drink ${drinkId} on day ${dayOfWeek}:`, windows);
    if (windows.length === 0) return null;
    return windows.map((w) => `${w.start}–${w.end}`).join(', ');
  };

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
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
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
                      if (index !== selectedDrinkIndex) {
                        setSelectedDrinkIndex(index);
                        setSelectedDay(0);
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

                  <View style={styles.dayTabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabsScroll}>
                      {dayNames.map((day, index) => {
                        const currentDrink = freeDrinks[selectedDrinkIndex];
                        const availability = currentDrink ? getAvailabilityForDrink(currentDrink.id, index) : null;
                        const isAvailable = availability !== null;
                        const isSelected = selectedDay === index;
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dayTab,
                              isSelected && styles.dayTabSelected,
                              !isAvailable && styles.dayTabDisabled
                            ]}
                            onPress={() => {
                              console.log(`[VenueDetail] Day tab pressed: ${day} (${index}), isAvailable: ${isAvailable}, availability: ${availability}`);
                              if (isAvailable) {
                                setSelectedDay(index);
                              }
                            }}
                            disabled={!isAvailable}
                            activeOpacity={isAvailable ? 0.7 : 1}
                          >
                            <Text style={[
                              styles.dayTabTextShort,
                              isSelected && styles.dayTabTextSelected,
                              !isAvailable && styles.dayTabTextDisabled
                            ]}>
                              {dayNamesShort[index]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.availabilityInfo}>
                    {(() => {
                      const currentDrink = freeDrinks[selectedDrinkIndex];
                      const availability = currentDrink ? getAvailabilityForDrink(currentDrink.id, selectedDay) : null;
                      if (availability) {
                        return (
                          <View style={styles.availabilityCard}>
                            <Text style={styles.availabilityTitle}>Az ital az alábbi időpontokban elérhető</Text>
                            <View style={styles.availabilityTimeContainer}>
                              <Clock size={16} color={Colors.dark.primary} />
                              <Text style={styles.availabilityTime}>{availability}</Text>
                            </View>
                          </View>
                        );
                      } else {
                        return (
                          <View style={styles.availabilityCard}>
                            <Text style={styles.availabilityUnavailable}>Ezen a napon nem elérhető</Text>
                          </View>
                        );
                      }
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
              ) : venue.latitude && venue.longitude ? (
                Platform.OS === 'web' ? (
                  <View style={styles.mapContainer}>
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${venue.longitude - 0.01},${venue.latitude - 0.01},${venue.longitude + 0.01},${venue.latitude + 0.01}&layer=mapnik&marker=${venue.latitude},${venue.longitude}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                      title="Venue Map"
                    />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.mapContainer}
                    onPress={() => {
                      const url = Platform.select({
                        ios: `maps:?daddr=${venue.latitude},${venue.longitude}&dirflg=d`,
                        android: `geo:${venue.latitude},${venue.longitude}?q=${venue.latitude},${venue.longitude}(${encodeURIComponent(venue.name)})`,
                        default: `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
                      });
                      if (url) {
                        Linking.openURL(url).catch(err => {
                          console.error('[VenueDetail] Failed to open maps:', err);
                        });
                      }
                    }}
                  >
                    <Image
                      source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+2BB7FF(${venue.longitude},${venue.latitude})/${venue.longitude},${venue.latitude},14,0/400x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw` }}
                      style={styles.mapView}
                      resizeMode="cover"
                    />
                    <View style={styles.mapOverlay}>
                      <MapPin size={16} color="#fff" />
                      <Text style={styles.mapOverlayText}>Kattints a térképhez</Text>
                    </View>
                  </TouchableOpacity>
                )
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
                  if (venue.latitude && venue.longitude) {
                    const url = Platform.select({
                      ios: `maps:?daddr=${venue.latitude},${venue.longitude}&dirflg=d`,
                      android: `geo:${venue.latitude},${venue.longitude}?q=${venue.latitude},${venue.longitude}(${encodeURIComponent(venue.name)})`,
                      web: `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
                      default: `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
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

        <View style={[styles.bottomCarousel, { left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 }]}>
          <TouchableOpacity style={styles.carouselCard} onPress={() => setShowRedeemModal(true)} activeOpacity={0.9}>
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
          </TouchableOpacity>
        </View>
      </View>

      <RedeemModal visible={showRedeemModal} onClose={() => setShowRedeemModal(false)} rewardImage={freeDrinks[0]?.imageUrl ?? null} />
    </Modal>
  );
}

interface RedeemModalProps {
  visible: boolean;
  onClose: () => void;
  rewardImage: string | null;
}

function RedeemModal({ visible, onClose, rewardImage }: RedeemModalProps) {
  const bg = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ddlayzwi6fgj2ujl1jgji';
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={redeemStyles.overlay}>
        <View style={redeemStyles.container}>
          <ImageBackground 
            source={{ uri: bg }} 
            resizeMode="cover" 
            style={redeemStyles.bg}
            imageStyle={redeemStyles.bgImage}
            defaultSource={placeholder}
          >
            <View style={redeemStyles.scrim} />
            <ScrollView contentContainerStyle={redeemStyles.content} showsVerticalScrollIndicator={false}>
              <Text style={redeemStyles.title}>
                Legyél a vendéglátóhelyen,{"\n"}
                hogy igényelhesed az{"\n"}
                ingyen italod
              </Text>

              <View style={redeemStyles.buttonContainer}>
                <TouchableOpacity 
                  style={redeemStyles.confirmButton}
                  onPress={onClose}
                  testID="confirm-here-button"
                >
                  <Text style={redeemStyles.confirmButtonText}>Itt vagyok</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={redeemStyles.cancelButton}
                  onPress={onClose}
                  testID="cancel-back-button"
                >
                  <Text style={redeemStyles.cancelButtonText}>Vissza</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </ImageBackground>
        </View>
      </View>
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
    top: 50,
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
    top: 50,
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
  dayTabsContainer: {
    marginBottom: 16,
  },
  dayTabsScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  dayTab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 90,
    alignItems: 'center',
  },
  dayTabSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    borderWidth: 2,
  },
  dayTabDisabled: {
    opacity: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dayTabTextShort: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dayTabTextLong: {
    color: Colors.dark.subtext,
    fontSize: 11,
    marginTop: 2,
  },
  dayTabTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  dayTabTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  availabilityInfo: {
    marginTop: 8,
  },
  availabilityCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  availabilityTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 8,
  },
  availabilityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityTime: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  availabilityUnavailable: {
    color: Colors.dark.subtext,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
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
    marginBottom: 80,
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
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
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
});

const redeemStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '92%',
    height: '82%',
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
  },
  bg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bgImage: {
    borderRadius: 20,
    opacity: 0.8,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 24,
    justifyContent: 'flex-end',
    minHeight: '100%',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.dark.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelButtonText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '500',
  },
});