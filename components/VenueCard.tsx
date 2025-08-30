import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { useRouter } from "expo-router";
import { Venue } from "@/types/venue";

type VenueCardProps = {
  venue: Venue;
  showRating?: boolean;
};

export default function VenueCard({ venue, showRating = true }: VenueCardProps) {
  const router = useRouter();

  const openVenueDetails = () => {
    router.push(`/venue/${venue.id}`);
  };

  const placeholderUri = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400';
  const imageSource = venue.image_url ? { uri: venue.image_url } : { uri: placeholderUri };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={openVenueDetails}
      activeOpacity={0.9}
      testID={`venue-card-${venue.id}`}
    >
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={styles.infoRow}>
          {showRating && (
            <View style={styles.rating}>
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          )}
          <View style={styles.location}>
            <MapPin size={14} color="#999" />
            <Text style={styles.distance}>1.2 km</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  rating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  distance: {
    fontSize: 14,
    color: '#999',
  },
});