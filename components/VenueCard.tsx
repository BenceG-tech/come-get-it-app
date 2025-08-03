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

  // Calculate price level as number for dollar signs
  const getPriceLevel = (priceLevel?: string): number => {
    if (!priceLevel) return 2;
    return priceLevel.length; // $ = 1, $ = 2, $$ = 3, $$ = 4
  };

  const priceNum = getPriceLevel(venue.priceLevel);
  const rating = 4; // Default rating since it's not in the venue type

  return (
    <TouchableOpacity 
      style={styles.venueCard} 
      onPress={openVenueDetails}
      activeOpacity={0.9}
      testID={`venue-card-${venue.id}`}
    >
      {/* Venue Image */}
      <Image
        source={{ uri: venue.image }}
        style={styles.venueImage}
        contentFit="cover"
      />

      {/* Overlay: Location Badge */}
      <View style={styles.locationBadge}>
        <Text style={styles.locationBadgeText}>Budapest</Text>
      </View>

      {/* Overlay: Venue Info Bar */}
      <View style={styles.venueOverlay}>
        <View style={styles.venueInfo}>
          {/* Venue Name */}
          <Text style={styles.venueName}>{venue.name}</Text>
          {/* Points */}
          <View style={styles.earnPointsContainer}>
            <Star size={16} color={Colors.primary} fill={Colors.primary} />
            <Text style={styles.earnPointsText}>Szerezz pontokat</Text>
          </View>
          {/* Category/Tags */}
          <Text style={styles.venueCategory}>
            {venue.category} • {venue.tags[0]} • {venue.location.city}
          </Text>
        </View>

        {/* Right Side: Drink, Rating, Price */}
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
                  dollar <= priceNum ? styles.dollarActive : styles.dollarInactive
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