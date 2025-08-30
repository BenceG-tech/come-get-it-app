import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from "expo-router";
import { Star, Filter } from 'lucide-react-native';
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

      <View style={styles.drinkBadge}>
        <Filter size={14} color={Colors.text} />
        <Text style={styles.drinkBadgeText}>Ingyen Ital Elérhető</Text>
      </View>

      <View style={styles.venueOverlay}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <View style={styles.earnPointsContainer}>
            <Star size={14} color={Colors.primary} fill={Colors.primary} />
            <Text style={styles.earnPointsText}>Szerezz pontokat</Text>
          </View>
          <Text style={styles.venueCategory}>
            Pub • {venue.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  venueCard: {
    width: width,
    height: 320,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    paddingBottom: 20,
  },
  drinkBadge: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  drinkBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  earnPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  earnPointsText: {
    color: Colors.primary,
    fontSize: 13,
    marginLeft: 4,
  },
  venueCategory: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});