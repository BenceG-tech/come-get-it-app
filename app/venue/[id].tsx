import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Star, Clock, MapPin, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { rest } from '@/lib/supabaseRest';
import { venues as mockVenues } from '@/data/venues';

type MockVenue = {
  id: string;
  name: string;
  description: string;
  image: string;
  address: string;
  latitude: number;
  longitude: number;
  tags: string[];
  category: string;
  isOpen: boolean;
  phone: string;
  website: string;
  priceLevel: string;
  location: {
    city: string;
    distance: string;
  };
  freeDrink: {
    name: string;
    description: string;
    image: string;
    ingredients: string;
  };
  offers: {
    title: string;
    description: string;
  }[];
};

const placeholder = require('../../assets/images/splash-icon.png');



export default function VenueModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showHours, setShowHours] = useState<boolean>(false);
  const [, setCurrentRewardIndex] = useState<number>(0);
  const [venue, setVenue] = useState<MockVenue | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      if (!id) {
        setError('No venue ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from Supabase first
        const res = await rest(`/venues?id=eq.${id}&select=*`);
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const supaVenue = data[0];
          // Map Supabase venue to MockVenue format
          const mappedVenue: MockVenue = {
            id: String(supaVenue.id),
            name: supaVenue.name || 'Unknown Venue',
            description: supaVenue.description || 'A great place to visit in Budapest.',
            image: supaVenue.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600',
            address: supaVenue.address || 'Budapest',
            latitude: supaVenue.latitude || 47.498,
            longitude: supaVenue.longitude || 19.056,
            tags: supaVenue.tags || [],
            category: supaVenue.category || 'Bar',
            isOpen: !supaVenue.is_paused,
            phone: supaVenue.phone || '+36 1 555 0000',
            website: supaVenue.website_url || '',
            priceLevel: supaVenue.price_level || '$',
            location: {
              city: 'Budapest',
              distance: '0.5'
            },
            freeDrink: {
              name: 'Johnnie Walker & Lemonade',
              description: 'A refreshing blend of premium Johnnie Walker Black Label whisky with fresh lemonade, served over ice with a lemon garnish.',
              image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600',
              ingredients: 'Johnnie Walker Black Label whisky, Lemonade, Lemon Garnish, Ice'
            },
            offers: [
              {
                title: 'Free Drink',
                description: 'Show this offer to receive a free welcome drink'
              }
            ]
          };
          setVenue(mappedVenue);
        } else {
          // Fallback to mock data if not found in Supabase
          const mockVenue = mockVenues.find(v => v.id === id);
          if (mockVenue) {
            setVenue(mockVenue as MockVenue);
          } else {
            setError('Venue not found');
          }
        }
      } catch (err) {
        console.error('Error fetching venue:', err);
        // Fallback to mock data on error
        const mockVenue = mockVenues.find(v => v.id === id);
        if (mockVenue) {
          setVenue(mockVenue as MockVenue);
        } else {
          setError('Failed to load venue');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading venue...</Text>
        </View>
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: 'red' }]}>{error || 'Venue not found'}</Text>
        <TouchableOpacity style={styles.directionsButton} onPress={() => router.back()}>
          <Text style={styles.directionsText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const headerImage = venue.image;
  const freeDrink = venue.freeDrink;

  const getCurrentHours = () => {
    return '23:00';
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={true}
      onRequestClose={() => router.back()}
    >
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: headerImage }}
              style={styles.image}
              resizeMode="cover"
            />
            
            {/* COME GET IT Overlay */}
            <View style={styles.brandOverlay}>
              <Text style={styles.comeGetItText}>COME{"\n"}GET IT</Text>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>FIRST{"\n"}CRAFT{"\n"}BEER</Text>
              </View>
            </View>
            
            {/* Location Badge */}
            <View style={styles.locationBadge}>
              <MapPin size={14} color={Colors.dark.text} />
              <Text style={styles.locationText}>{venue.location.city}</Text>
            </View>
            
            {/* Distance Badge */}
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceTextBadge}>{venue.location.distance}km</Text>
            </View>
            
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <Text style={styles.distanceText}>{venue.location.distance}km away</Text>
            
            {/* Earn Points Section */}
            <View style={styles.earnPointsCard}>
              <View style={styles.earnPointsHeader}>
                <Star size={20} color={Colors.dark.primary} fill={Colors.dark.primary} />
                <Text style={styles.earnPointsLabel}>Earn Points</Text>
                <Text style={styles.earnPointsType}>Restaurant - Reward</Text>
              </View>
              <View style={styles.earnPointsContent}>
                <View style={styles.earnPointsIcon}>
                  <Star size={24} color="#fff" fill="#fff" />
                </View>
                <View style={styles.earnPointsTextContainer}>
                  <Text style={styles.earnPointsTitle}>EARN POINTS</Text>
                  <Text style={styles.earnPointsDescription}>
                    When you spend money at this bar, you earn{"\n"}points to redeem on rewards
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.description}>
              {venue.description}
            </Text>
            
            {/* Opening Hours Section */}
            <TouchableOpacity 
              style={styles.hoursSection}
              onPress={() => setShowHours(!showHours)}
              activeOpacity={0.7}
            >
              <View style={styles.hoursHeader}>
                <Clock size={16} color={Colors.dark.text} />
                <Text style={styles.hoursTitle}>Nyitva</Text>
                <Text style={styles.hoursTime}>Zárás {getCurrentHours()}</Text>
                <ChevronDown 
                  size={20} 
                  color={Colors.dark.text} 
                  style={[styles.chevron, showHours && styles.chevronUp]}
                />
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
            <View style={styles.drinkSection}>
              <Text style={styles.drinkTitle}>Ingyen ital</Text>
              <Text style={styles.drinkName}>{freeDrink?.name}</Text>
              
              <Image
                source={{ uri: freeDrink?.image }}
                style={styles.drinkImage}
                resizeMode="cover"
              />
              
              <Text style={styles.drinkAvailability}>Az ital az alábbi idő pontokban elérhető</Text>
              
              <View style={styles.timeSlots}>
                {['Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo'].map((day) => (
                  <View key={day} style={styles.timeSlot}>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={styles.timeText}>11:00-23:00</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* About Drink Section */}
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Az italról</Text>
              <Text style={styles.aboutText}>
                {freeDrink?.description}
              </Text>
              
              <Text style={styles.ingredientsTitle}>Összetevők:</Text>
              <Text style={styles.ingredientsText}>
                {freeDrink?.ingredients}
              </Text>
            </View>
            
            {/* Map Section */}
            <View style={styles.mapSection}>
              <View style={styles.mapPlaceholder}>
                <MapPin size={24} color={Colors.dark.text} />
                <Text style={styles.mapText}>Map View</Text>
                <Text style={styles.mapSubtext}>Tap to view on map</Text>
              </View>
              
              <TouchableOpacity style={styles.directionsButton}>
                <Text style={styles.directionsText}>Mutasd a térképen</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </ScrollView>
        
        {/* Bottom Carousel */}
        <View style={styles.bottomCarousel}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
              setCurrentRewardIndex(index);
            }}
          >
            <TouchableOpacity 
              style={styles.carouselCard}
              onPress={() => setShowRedeemModal(true)}
              activeOpacity={0.9}
            >
              <View style={styles.carouselContent}>
                <View style={styles.carouselIcon}>
                  <Text style={styles.carouselIconText}>🍺</Text>
                </View>
                <Text style={styles.carouselTitle}>Kérd INGYEN italod</Text>
                <Text style={styles.carouselSubtitle}>Most elérhető</Text>
              </View>
              <View style={styles.carouselBrand}>
                <Text style={styles.carouselBrandText}>FIRST</Text>
              </View>
              <ChevronDown size={20} color={Colors.dark.text} style={styles.carouselArrow} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      
      <RedeemModal 
        visible={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)}
        rewardImage={freeDrink?.image ?? null}
      />
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

const { width, height } = Dimensions.get('window');



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
    height: height * 0.45,
    position: 'relative',
  },
  brandOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comeGetItText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    marginBottom: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dark.primary,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  image: {
    width: '100%',
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
    marginBottom: 8,
  },
  drinkName: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  drinkImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  drinkAvailability: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 12,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '30%',
    marginBottom: 8,
  },
  dayText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeText: {
    color: Colors.dark.subtext,
    fontSize: 12,
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
  earnPointsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  earnPointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  earnPointsLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
  },
  earnPointsType: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginLeft: 'auto',
  },
  earnPointsContent: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  carouselCard: {
    width: width - 40,
    marginHorizontal: 20,
    height: 80,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  carouselContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  carouselIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselIconText: {
    fontSize: 20,
  },
  carouselTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselSubtitle: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  carouselBrand: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  carouselBrandText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  carouselArrow: {
    transform: [{ rotate: '270deg' }],
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
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: Colors.dark.background,
    borderRadius: 20,
    overflow: 'hidden',
  },
  drinkImage: {
    width: '100%',
    height: height * 0.4,
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