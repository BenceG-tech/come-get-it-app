import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { X, Star, Clock } from 'lucide-react-native';
import { rest } from '@/lib/supabaseRest';
import Colors from '@/constants/colors';
import { Venue } from '@/types/venue';

export default function VenueModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        console.info('[SupabaseMobile] Load venue detail', id);
        const venueRes = await rest(`/venues?id=eq.${id}&select=*`);
        const venueArr = (await venueRes.json()) as any[];
        const v = venueArr?.[0];

        const windowsRes = await rest(`/free_drink_windows?venue_id=eq.${id}&select=*`);
        const windows = await windowsRes.json();

        const rewardsRes = await rest(`/rewards?venue_id=eq.${id}&select=*`);
        const rewards = await rewardsRes.json();

        if (!v) {
          setError('Not found');
          setLoading(false);
          return;
        }

        const mapped: Venue = {
          id: String(v.id),
          name: v.name ?? '-',
          description: v.description ?? '',
          image: v.image_url ?? 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop',
          address: v.address ?? '-',
          latitude: v.latitude ?? 47.4979,
          longitude: v.longitude ?? 19.0402,
          tags: Array.isArray(v.tags) ? v.tags : ['bar'],
          category: v.category ?? 'Bar',
          isOpen: true,
          phone: v.phone ?? undefined,
          website: v.website_url ?? undefined,
          offers: [],
          priceLevel: '$' as const,
          location: { city: v.city ?? 'Budapest', distance: '0.5' },
          freeDrink: {
            name: v.free_drink_name ?? 'Welcome Beer',
            description: v.free_drink_description ?? 'Redeem a free welcome beer.',
            image: v.free_drink_image_url ?? 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=1200&auto=format&fit=crop',
            ingredients: 'Barley, hops, water, yeast',
          },
        };

        console.info('[SupabaseMobile] Windows', Array.isArray(windows) ? windows.length : 0);
        console.info('[SupabaseMobile] Rewards', Array.isArray(rewards) ? rewards.length : 0);

        setVenue(mapped);
        setLoading(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.error('[SupabaseMobile] Detail error', e);
        setError(msg);
        setLoading(false);
      }
    };
    load();
  }, [id]);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  if (error || !venue) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{error ?? 'No venue found'}</Text>
        <TouchableOpacity style={styles.directionsButton} onPress={() => router.back()}>
          <Text style={styles.directionsText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={true}
      onRequestClose={() => router.back()}
    >
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: venue.image }}
              style={styles.image}
              contentFit="cover"
            />
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
            
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>{venue.location.city}</Text>
            </View>
            
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{venue.location.distance || '0.3'} km</Text>
            </View>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.venueName}>{venue.name}</Text>
            
            <View style={styles.earnPointsContainer}>
              <Star size={16} color={Colors.dark.primary} fill={Colors.dark.primary} />
              <Text style={styles.earnPointsText}>Szerezz pontokat</Text>
            </View>
            
            <Text style={styles.venueCategory}>
              {venue.category} • {venue.tags[0]} • {venue.location.city}
            </Text>
            
            <Text style={styles.description}>{venue.description}</Text>
            
            <View style={styles.hoursSection}>
              <View style={styles.hoursHeader}>
                <Clock size={16} color={Colors.dark.text} />
                <Text style={styles.hoursTitle}>Nyitva</Text>
                <Text style={styles.hoursTime}>Zárás 23:00</Text>
              </View>
            </View>
            
            <View style={styles.drinkSection}>
              <Text style={styles.drinkTitle}>Ingyen ital</Text>
              <Text style={styles.drinkName}>{venue.freeDrink.name}</Text>
              
              <Image
                source={{ uri: venue.freeDrink.image }}
                style={styles.drinkImage}
                contentFit="cover"
              />
              
              <Text style={styles.drinkAvailability}>Az ital az alábbi idő pontokban elérhető</Text>
              
              <View style={styles.timeSlots}>
                {['Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo'].map((day, index) => (
                  <View key={day} style={styles.timeSlot}>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={styles.timeText}>11:00-23:00</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Az italról</Text>
              <Text style={styles.aboutText}>{venue.freeDrink.description}</Text>
              
              <Text style={styles.ingredientsTitle}>Ingredients</Text>
              <Text style={styles.ingredientsText}>
                {venue.freeDrink.ingredients}
              </Text>
            </View>
            
            <View style={styles.mapSection}>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapText}>Map View</Text>
              </View>
              
              <TouchableOpacity style={styles.directionsButton}>
                <Text style={styles.directionsText}>Mutasd a térképen</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.claimButton}
              onPress={() => setShowRedeemModal(true)}
            >
              <Text style={styles.claimButtonText}>Kérd INGYEN Italod</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      <RedeemModal 
        visible={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)}
        venue={venue}
      />
    </Modal>
  );
}

interface RedeemModalProps {
  visible: boolean;
  onClose: () => void;
  venue: Venue;
}

function RedeemModal({ visible, onClose, venue }: RedeemModalProps) {
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
            source={{ uri: venue.freeDrink.image }}
            style={redeemStyles.drinkImage}
            contentFit="cover"
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
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    color: Colors.dark.text,
    fontSize: 12,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: Colors.dark.text,
    fontSize: 12,
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
    marginBottom: 20,
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