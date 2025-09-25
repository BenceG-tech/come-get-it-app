import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator, useWindowDimensions, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Star, Clock, MapPin, ChevronDown, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getVenueWithDetails } from '@/lib/supabaseProvider';
import { VenueWithDetails, VenueDrink } from '@/types/venue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const placeholder = require('../../assets/images/splash-icon.png');



export default function VenueModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showHours, setShowHours] = useState<boolean>(false);

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

  const venueImages = useMemo(() => {
    const arr: string[] = [];
    if (venue?.hero_image_url) arr.push(venue.hero_image_url);
    if (venue?.image_url) arr.push(venue.image_url);
    (venue?.images ?? []).forEach((imageUrl) => { 
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() && imageUrl.length <= 2000 && !arr.includes(imageUrl)) {
        arr.push(imageUrl.trim()); 
      }
    });
    return arr.length > 0 ? arr : ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200'];
  }, [venue]);

  const freeDrinks: VenueDrink[] = useMemo(() => (venue?.drinks ?? []).filter((d) => d.isFreeDrink), [venue]);
  const freeDrinkWindows = useMemo(() => venue?.freeDrinkWindows ?? [], [venue]);

  // Check if any free drink is currently available
  const isCurrentlyAvailable = useMemo(() => {
    if (freeDrinks.length === 0 || freeDrinkWindows.length === 0) return false;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
    
    // Convert Sunday=0 to Monday=0 format (0=Mon, 1=Tue, ..., 6=Sun)
    const dayIndex = currentDay === 0 ? 6 : currentDay - 1;
    
    return freeDrinkWindows.some(window => {
      if (window.dayOfWeek !== dayIndex) return false;
      return currentTime >= window.start && currentTime <= window.end;
    });
  }, [freeDrinks, freeDrinkWindows]);

  // Get the primary free drink (first one)
  const primaryFreeDrink = freeDrinks[0] || null;

  // Get hero image for free drink section
  const freeDrinkHeroImage = useMemo(() => {
    if (primaryFreeDrink?.imageUrl) return primaryFreeDrink.imageUrl;
    if (venue?.hero_image_url) return venue.hero_image_url;
    if (venue?.image_url) return venue.image_url;
    if (venueImages[0]) return venueImages[0];
    return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200';
  }, [primaryFreeDrink, venue, venueImages]);

  // Generate day grid for free drink availability
  const generateDayGrid = (): {day: string, timeSlots: string[], isActive: boolean}[] => {
    const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    const shortDayNames = ['H', 'K', 'Sz', 'Cs', 'P', 'Szo', 'V'];
    
    return dayNames.map((dayName, index) => {
      const dayWindows = freeDrinkWindows.filter(w => w.dayOfWeek === index);
      const timeSlots = dayWindows.map(w => `${w.start}–${w.end}`);
      
      return {
        day: shortDayNames[index],
        timeSlots,
        isActive: timeSlots.length > 0
      };
    });
  };

  const openMapsApp = () => {
    // Mock coordinates for demo - in real app this would come from venue data
    const lat = 47.4979;
    const lng = 19.0402;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      web: `https://maps.google.com/?q=${lat},${lng}`
    });
    
    if (url) {
      Linking.openURL(url).catch((err: unknown) => {
        console.error('Error opening maps:', err instanceof Error ? err.message : String(err));
      });
    }
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
              {venueImages.map((uri, idx) => (
                <Image testID={`venue-image-${idx}`} key={`${uri || 'img'}-${idx}`} source={{ uri }} style={[styles.image, { width }]} resizeMode="cover" />
              ))}
            </ScrollView>
            <View style={styles.locationBadge}>
              <MapPin size={14} color={Colors.dark.text} />
              <Text style={styles.locationText}>Budapest</Text>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceTextBadge}>{venue.distance ? (venue.distance / 1000).toFixed(1) : '0.5'}km</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <Text style={styles.distanceText}>{venue.distance ? (venue.distance / 1000).toFixed(1) : '0.5'}km away</Text>

            <View style={styles.earnPointsContent}>
              <View style={styles.earnPointsIcon}>
                <Star size={24} color="#fff" fill="#fff" />
              </View>
              <View style={styles.earnPointsTextContainer}>
                <Text style={styles.earnPointsTitle}>EARN POINTS</Text>
                <Text style={styles.earnPointsDescription}>When you spend money at this bar, you earn{"\n"}points to redeem on rewards</Text>
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

            {/* Free Drink Section */}
            {primaryFreeDrink && (
              <View style={styles.freeDrinkSection}>
                {/* Hero Image */}
                <View style={styles.freeDrinkHeroContainer}>
                  <Image 
                    source={{ uri: freeDrinkHeroImage }}
                    style={styles.freeDrinkHeroImage}
                    resizeMode="cover"
                  />
                </View>
                
                {/* Drink Title */}
                <View style={styles.freeDrinkTitleContainer}>
                  <Text style={styles.freeDrinkTitle}>{primaryFreeDrink.drinkName}</Text>
                  {isCurrentlyAvailable && (
                    <View style={styles.availableChip}>
                      <Text style={styles.availableChipText}>Most elérhető</Text>
                    </View>
                  )}
                </View>
                
                {/* Availability Schedule */}
                <Text style={styles.availabilityTitle}>Az ital az alábbi időpontokban elérhető</Text>
                
                <View style={styles.dayGrid}>
                  {generateDayGrid().map((dayInfo) => (
                    <View key={dayInfo.day} style={[styles.dayCell, dayInfo.isActive && styles.dayCellActive]}>
                      <Text style={[styles.dayName, dayInfo.isActive && styles.dayNameActive]}>
                        {dayInfo.day}
                      </Text>
                      <Text style={[styles.dayTime, dayInfo.isActive && styles.dayTimeActive]}>
                        {dayInfo.timeSlots.length > 0 ? dayInfo.timeSlots[0] : '–'}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {/* About the Drink */}
                {primaryFreeDrink.drinkName && (
                  <View style={styles.aboutDrinkSection}>
                    <Text style={styles.aboutDrinkTitle}>Az italról</Text>
                    <Text style={styles.aboutDrinkText}>
                      Örök komlóval fűszerezett, virágos illatbombájú, sűrű, gyümölcsszerűen átjárszó New England IPA.
                    </Text>
                  </View>
                )}
                
                {/* Ingredients */}
                <View style={styles.ingredientsSection}>
                  <Text style={styles.ingredientsTitle}>Összetevők:</Text>
                  <Text style={styles.ingredientsText}>
                    Pale Ale, Búzapehely, Pilsner, Búzamaláta, Zabmaláta, CaraHell, CaraPils
                  </Text>
                </View>
              </View>
            )}

            {/* Map Section */}
            <View style={styles.mapSection}>
              <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                  <MapPin size={32} color={Colors.dark.primary} />
                  <Text style={styles.mapText}>FIRST Local Craft Beer and Kitchen</Text>
                  <Text style={styles.mapSubtext}>FIRST Craft Beer & BBQ</Text>
                </View>
                {/* Mock map pins overlay */}
                <View style={styles.mapPinsOverlay}>
                  <View style={[styles.mapPin, { top: 60, left: 120 }]}>
                    <MapPin size={20} color="#FF4444" fill="#FF4444" />
                  </View>
                  <View style={[styles.mapPin, { top: 100, left: 180 }]}>
                    <MapPin size={20} color="#FF4444" fill="#FF4444" />
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.directionsButton} onPress={openMapsApp}>
                <Text style={styles.directionsText}>Mutasd a térképen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        {primaryFreeDrink && (
          <View style={styles.stickyCTA}>
            <TouchableOpacity 
              style={styles.ctaButton} 
              onPress={() => setShowRedeemModal(true)} 
              activeOpacity={0.9}
            >
              <View style={styles.ctaContent}>
                <View style={styles.ctaIconContainer}>
                  {primaryFreeDrink.imageUrl ? (
                    <Image 
                      source={{ uri: primaryFreeDrink.imageUrl }}
                      style={styles.ctaIcon}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.ctaIconPlaceholder}>
                      <Text style={styles.ctaIconText}>🍺</Text>
                    </View>
                  )}
                </View>
                <View style={styles.ctaTextContainer}>
                  <Text style={styles.ctaTitle}>Kérd INGYEN italod</Text>
                  {isCurrentlyAvailable && (
                    <Text style={styles.ctaSubtitle}>Most elérhető</Text>
                  )}
                </View>
              </View>
              <View style={styles.ctaBrand}>
                <Text style={styles.ctaBrandText}>FIRST</Text>
              </View>
              <ArrowRight size={16} color="#000000" style={styles.ctaArrow} />
            </TouchableOpacity>
          </View>
        )}
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
    top: 50,
    right: 70,
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
  venueName: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
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
    marginBottom: 100,
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
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  directionsText: {
    color: Colors.dark.background,
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
    backgroundColor: '#0A5A6B',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  earnPointsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnPointsTextContainer: {
    flex: 1,
  },
  earnPointsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earnPointsDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 18,
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
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: 'transparent',
  },
  carouselCard: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselIconText: {
    fontSize: 18,
  },
  carouselTitle: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carouselSubtitle: {
    color: '#666666',
    fontSize: 11,
  },
  carouselBrand: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  carouselBrandText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  carouselArrow: {
    transform: [{ rotate: '270deg' }],
    marginRight: 4,
  },
  // Free Drink Section Styles
  freeDrinkSection: {
    marginBottom: 24,
  },
  freeDrinkHeroContainer: {
    marginBottom: 16,
  },
  freeDrinkHeroImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  freeDrinkTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  freeDrinkTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  availableChip: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  availabilityTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  dayCell: {
    flex: 1,
    minWidth: 45,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayCellActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  dayName: {
    color: Colors.dark.subtext,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayNameActive: {
    color: '#fff',
  },
  dayTime: {
    color: Colors.dark.subtext,
    fontSize: 10,
    textAlign: 'center',
  },
  dayTimeActive: {
    color: '#E5E7EB',
  },
  aboutDrinkSection: {
    marginBottom: 16,
  },
  aboutDrinkTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutDrinkText: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  // Map Section Updates
  mapPinsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPin: {
    position: 'absolute',
  },
  // Sticky CTA Styles
  stickyCTA: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  ctaIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaIconText: {
    fontSize: 20,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ctaSubtitle: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  ctaBrand: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  ctaBrandText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ctaArrow: {
    marginRight: 4,
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