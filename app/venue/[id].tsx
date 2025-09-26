import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Star, Clock, MapPin, ChevronDown, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getVenueWithDetails } from '@/lib/supabaseProvider';
import { VenueWithDetails, VenueDrink } from '@/types/venue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const placeholder = require('../../assets/images/splash-icon.png');



export default function VenueModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showHours, setShowHours] = useState<boolean>(false);
  const [, setCurrentRewardIndex] = useState<number>(0);
  const [venue, setVenue] = useState<VenueWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        const v = await getVenueWithDetails(String(id));
        if (!v) {
          setError('Venue not found');
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
    if (venue?.hero_image_url) arr.push(venue.hero_image_url);
    if (venue?.image_url) arr.push(venue.image_url);
    (venue?.images ?? []).forEach((imageUrl) => { 
      if (imageUrl && imageUrl.trim() && imageUrl.length <= 2000 && !arr.includes(imageUrl)) {
        arr.push(imageUrl.trim()); 
      }
    });
    return arr.length > 0 ? arr : ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200'];
  }, [venue]);

  const freeDrinks: VenueDrink[] = useMemo(() => (venue?.drinks ?? []).filter((d) => d.isFreeDrink), [venue]);
  const freeDrinkWindows = venue?.freeDrinkWindows ?? [];

  const formatTimeSlots = (drinkId: string): string => {
    const drinkWindows = freeDrinkWindows.filter((w) => w.drinkId === drinkId);
    if (drinkWindows.length === 0) return 'Nincs megadott idősáv';
    
    const dayNames = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
    const groupedByTime: Record<string, number[]> = {};
    
    drinkWindows.forEach((w) => {
      const timeKey = `${w.start}–${w.end}`;
      if (!groupedByTime[timeKey]) groupedByTime[timeKey] = [];
      groupedByTime[timeKey].push(w.dayOfWeek);
    });
    
    return Object.entries(groupedByTime).map(([timeRange, days]) => {
      const sortedDays = days.sort((a, b) => a - b);
      let dayRange = '';
      
      if (sortedDays.length === 1) {
        dayRange = dayNames[sortedDays[0]];
      } else if (sortedDays.length === 5 && sortedDays.every((d, i) => d === i)) {
        dayRange = 'H-P';
      } else if (sortedDays.length === 7) {
        dayRange = 'H-V';
      } else {
        const ranges: string[] = [];
        let start = sortedDays[0];
        let end = start;
        
        for (let i = 1; i < sortedDays.length; i++) {
          if (sortedDays[i] === end + 1) {
            end = sortedDays[i];
          } else {
            ranges.push(start === end ? dayNames[start] : `${dayNames[start]}-${dayNames[end]}`);
            start = sortedDays[i];
            end = start;
          }
        }
        ranges.push(start === end ? dayNames[start] : `${dayNames[start]}-${dayNames[end]}`);
        dayRange = ranges.join(', ');
      }
      
      return `${dayRange} • ${timeRange}`;
    }).join('\n');
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


  const getCurrentHours = () => '23:00';

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
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {galleryImages.map((uri, idx) => (
                <Image testID={`venue-image-${idx}`} key={`${uri || 'img'}-${idx}`} source={{ uri }} style={[styles.image, { width }]} resizeMode="cover" />
              ))}
            </ScrollView>
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
              <View style={styles.tagsContainer}>
                <Text style={styles.tagText}>pizza</Text>
                <Text style={styles.tagText}>ingyen ital</Text>
                <Text style={styles.tagText}>terasz</Text>
              </View>
            </View>

            <View style={styles.earnPointsContent} testID="earn-points-card">
              <View style={styles.earnPointsIcon} testID="earn-points-icon">
                <Star size={22} color={Colors.dark.primary} fill={Colors.dark.primary} />
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
                <Text style={styles.hoursTitle}>Nyitva</Text>
                <Text style={styles.hoursTime}>Zárás {getCurrentHours()}</Text>
                <ChevronDown size={20} color={Colors.dark.text} style={[styles.chevron, showHours && styles.chevronUp]} />
              </View>
              {showHours && (
                <View style={styles.hoursDetails}>
                  {['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'].map((day) => (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.hoursDay}>{day}</Text>
                      <Text style={styles.hoursTime}>09:00 - 23:00</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.drinkSection}>
              <Text style={styles.drinkTitle}>Ingyen italok</Text>
              {freeDrinks.length === 0 ? (
                <Text style={styles.emptyStateText}>Nincs elérhető ingyen ital.</Text>
              ) : (
                freeDrinks.map((drink) => {
                  const timeSlotText = formatTimeSlots(drink.id);
                  return (
                    <View key={drink.id} style={styles.freeDrinkCard}>
                      <View style={styles.freeDrinkContent}>
                        <View style={styles.freeDrinkImageContainer}>
                          {drink.imageUrl ? (
                            <Image 
                              source={{ uri: drink.imageUrl }} 
                              style={styles.freeDrinkThumbnail} 
                              resizeMode="cover" 
                            />
                          ) : (
                            <View style={styles.freeDrinkPlaceholder}>
                              <Text style={styles.freeDrinkPlaceholderText}>🍺</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.freeDrinkInfo}>
                          <Text style={styles.freeDrinkName}>{drink.drinkName}</Text>
                          <Text style={styles.freeDrinkTimeSlots}>{timeSlotText}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.mapSection}>
              <View style={styles.mapPlaceholder}>
                <MapPin size={24} color={Colors.dark.text} />
                <Text style={styles.mapText}>Map View</Text>
                <Text style={styles.mapSubtext}>Tap to view on map</Text>
              </View>
              <TouchableOpacity style={styles.directionsButton} testID="show-on-map-button" accessibilityRole="button" accessibilityLabel="Mutasd a térképen">
                <Text style={styles.directionsText}>Mutasd a térképen</Text>
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
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={redeemStyles.overlay}>
        <View style={redeemStyles.container}>
          <Image
            source={rewardImage ? { uri: rewardImage } : placeholder}
            style={redeemStyles.drinkImage}
            resizeMode="cover"
          />
          
          <View style={redeemStyles.content}>
            <Text style={redeemStyles.title}>
              Legyél a vendéglátóhelyen,{"\n"}
              hogy igényelhesed az{"\n"}
              ingyen italod
            </Text>
            
            <View style={redeemStyles.buttonContainer}>
              <TouchableOpacity 
                style={redeemStyles.confirmButton}
                onPress={onClose}
              >
                <Text style={redeemStyles.confirmButtonText}>Itt vagyok</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={redeemStyles.cancelButton}
                onPress={onClose}
              >
                <Text style={redeemStyles.cancelButtonText}>Vissza</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  image: {
    height: '100%',
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
  freeDrinkCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  freeDrinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeDrinkImageContainer: {
    marginRight: 16,
  },
  freeDrinkThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  freeDrinkPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeDrinkPlaceholderText: {
    fontSize: 24,
  },
  freeDrinkInfo: {
    flex: 1,
  },
  freeDrinkName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  freeDrinkTimeSlots: {
    color: Colors.dark.subtext,
    fontSize: 14,
    lineHeight: 20,
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
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  tagText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '400',
  },
  earnPointsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 44,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  carouselCard: {
    height: 44,
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselIconText: {
    fontSize: 18,
  },
  carouselTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carouselSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
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
    width: '90%',
    maxHeight: 560,
    backgroundColor: Colors.dark.background,
    borderRadius: 20,
    overflow: 'hidden',
  },
  drinkImage: {
    width: '100%',
    height: 320,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
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
    paddingVertical: 16,
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