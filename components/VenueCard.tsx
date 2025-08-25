import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from "expo-router";
import { Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Venue } from "@/types/venue";

const { width } = Dimensions.get('window');

type VenueCardProps = {
  venue: Venue;
};

export default function VenueCard({ venue }: VenueCardProps) {
  const router = useRouter();

  const openVenueDetails = () => {
    router.push(`/venue/${venue.id}`);
  };

  const placeholder = require('../assets/images/splash-icon.png');
  const imageSource = venue.image_url ? { uri: venue.image_url } : placeholder;
  const rating = 4;

  return (
    <TouchableOpacity 
      style={styles.venueCard} 
      onPress={openVenueDetails}
      activeOpacity={0.9}
      testID={`venue-card-${venue.id}`}
    >
      <Image
        source={imageSource}
        style={styles.venueImage}
        contentFit="cover"
      />

      <View style={styles.locationBadge}>
        <Text style={styles.locationBadgeText}>Budapest</Text>
      </View>

      <View style={styles.venueOverlay}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <View style={styles.earnPointsContainer}>
            <Star size={16} color={Colors.primary} fill={Colors.primary} />
            <Text style={styles.earnPointsText}>Szerezz pontokat</Text>
          </View>
          <Text style={styles.venueCategory}>
            {venue.address}
          </Text>
        </View>

        <View style={styles.venueRightInfo}>
          <Text style={styles.drinkAvailable}>Ingyen Ital Elérhető</Text>
          <View style={styles.ratingContainer}>
            {[1,2,3,4,5].map((star) => (
              <Star 
                key={star} 
                size={14} 
                color={star <= Math.floor(rating) ? "#FFD600" : "#666"}
                fill={star <= Math.floor(rating) ? "#FFD600" : 'transparent'}
              />
            ))}
          </View>
          <View style={styles.priceContainer}>
            {[1,2,3,4].map((dollar) => (
              <Text 
                key={dollar} 
                style={[
                  styles.dollarSign,
                  dollar <= 2 ? styles.dollarActive : styles.dollarInactive
                ]}
              >
                $
              </Text>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  venueCard: {
    width: width,
    height: 280,
    marginBottom: 2,
    position: 'relative',
    backgroundColor: Colors.cardBackground,
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  locationBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationBadgeText: {
    color: Colors.text,
    fontSize: 12,
  },
  venueOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earnPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  earnPointsText: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  venueCategory: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  venueRightInfo: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  drinkAvailable: {
    color: Colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dollarActive: {
    color: Colors.text,
  },
  dollarInactive: {
    color: Colors.inactive,
  },
});