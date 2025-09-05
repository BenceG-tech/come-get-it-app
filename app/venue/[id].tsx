import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { X, Star, Clock, MapPin } from 'lucide-react-native';
import { rest } from '@/lib/supabaseRest';
import Colors from '@/constants/colors';
import { Venue, OpeningHours } from '@/types/venue';

type Window = { days: string | null; start_time: string | null; end_time: string | null; timezone: string | null };
 type Reward = { id: string; name: string | null; points_required: number | null; valid_until: string | null; active: boolean | null; image_url: string | null };

const placeholder = require('../../assets/images/splash-icon.png');

function renderOpeningHours(hours: OpeningHours | null | undefined) {
  if (!hours) return null;
  
  const days = [
    { key: 'monday', label: 'Hétfő' },
    { key: 'tuesday', label: 'Kedd' },
    { key: 'wednesday', label: 'Szerda' },
    { key: 'thursday', label: 'Csütörtök' },
    { key: 'friday', label: 'Péntek' },
    { key: 'saturday', label: 'Szombat' },
    { key: 'sunday', label: 'Vasárnap' },
  ];
  
  return (
    <View style={styles.hoursDetails}>
      {days.map(({ key, label }) => {
        const dayHours = hours[key as keyof OpeningHours];
        return (
          <View key={key} style={styles.hoursRow}>
            <Text style={styles.hoursDay}>{label}</Text>
            <Text style={styles.hoursTime}>
              {dayHours?.closed ? 'Zárva' : dayHours ? `${dayHours.open} - ${dayHours.close}` : '09:00 - 23:00'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function VenueModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [windows, setWindows] = useState<Window[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        console.info('[SupabaseMobile] Load venue detail', id);
        const venueRes = await rest(`/venues?id=eq.${id}&select=id,name,address,description,phone_number,website_url,hero_image_url,image_url,distance`);
        const venueArr = (await venueRes.json()) as Venue[];
        const v = venueArr?.[0] ?? null;

        const windowsRes = await rest(`/free_drink_windows?venue_id=eq.${id}&select=days,start_time,end_time,timezone`);
        const win = (await windowsRes.json()) as Window[];

        const rewardsRes = await rest(`/rewards?venue_id=eq.${id}&select=id,name,points_required,valid_until,active,image_url`);
        const rws = (await rewardsRes.json()) as Reward[];

        if (!v) {
          setError('Not found');
          setLoading(false);
          return;
        }

        setVenue(v);
        setWindows(Array.isArray(win) ? win : []);
        setRewards(Array.isArray(rws) ? rws : []);
        console.info('[SupabaseMobile] Windows', win?.length ?? 0);
        console.info('[SupabaseMobile] Rewards', rws?.length ?? 0);
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
        <Text style={[styles.loadingText, { color: 'red' }]}>{error ?? 'No venue found'}</Text>
        <TouchableOpacity style={styles.directionsButton} onPress={() => router.back()}>
          <Text style={styles.directionsText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const headerImage = venue.hero_image_url ?? venue.image_url ?? null;
  const firstReward = rewards[0];

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
              source={headerImage ? { uri: headerImage } : placeholder}
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
              <Text style={styles.locationText}>{venue.address}</Text>
            </View>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <Text style={styles.distanceText}>{venue.distance ? `${venue.distance}m` : '300m'}</Text>
            
            <View style={styles.pointsBanner}>
              <View style={styles.pointsBannerContent}>
                <View style={styles.pointsRow}>
                  <Star size={20} color={Colors.text} fill={Colors.text} />
                  <Text style={styles.pointsTitle}>SZEREZZ PONTOKAT</Text>
                </View>
                <Text style={styles.pointsDescription}>
                  Ha itt fogyasztasz, gyűjthetsz a pontjaid,
                  melyeket értékes jutalmakra válthatsz.
                </Text>
              </View>
            </View>
            
            <Text style={styles.venueCategory}>
              Pub • {venue.address}
            </Text>
            
            <Text style={styles.description}>{venue.description ?? ''}</Text>
            
            <View style={styles.hoursSection}>
              <View style={styles.hoursHeader}>
                <Clock size={16} color={Colors.dark.text} />
                <Text style={styles.hoursTitle}>Nyitva</Text>
                <Text style={styles.hoursTime}>Zárás 23:00</Text>
              </View>
              {renderOpeningHours(venue.opening_hours)}
            </View>
            
            <View style={styles.drinkSection}>
              <Text style={styles.drinkTitle}>Ingyen ital</Text>
              <Text style={styles.drinkName}>{firstReward?.name ?? 'Welcome Drink'}</Text>
              
              <Image
                source={firstReward?.image_url ? { uri: firstReward.image_url } : placeholder}
                style={styles.drinkImage}
                contentFit="cover"
              />
              
              <Text style={styles.drinkAvailability}>Az ital az alábbi idő pontokban elérhető</Text>
              
              <View style={styles.timeSlots}>
                {windows.length > 0 ? (
                  windows.map((w, idx) => (
                    <View key={`${idx}`} style={styles.timeSlot}>
                      <Text style={styles.dayText}>{w.days ?? ''}</Text>
                      <Text style={styles.timeText}>{`${w.start_time ?? ''}-${w.end_time ?? ''}`}</Text>
                    </View>
                  ))
                ) : (
                  ['Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo'].map((day) => (
                    <View key={day} style={styles.timeSlot}>
                      <Text style={styles.dayText}>{day}</Text>
                      <Text style={styles.timeText}>11:00-23:00</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
            
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Az italról</Text>
              <Text style={styles.aboutText}>{firstReward?.name ?? 'Ingyen ital a helyszínen.'}</Text>
              
              <Text style={styles.ingredientsTitle}>Összetevők</Text>
              <Text style={styles.ingredientsText}>
                Vodka, Lime juice, Ginger beer, Menta
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
        rewardImage={firstReward?.image_url ?? null}
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
  pointsBanner: {
    backgroundColor: Colors.dark.primary,
    marginHorizontal: -20,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
  },
  pointsBannerContent: {
    alignItems: 'center',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pointsTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pointsDescription: {
    color: Colors.text,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9,
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