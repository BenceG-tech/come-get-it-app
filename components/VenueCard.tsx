import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { Star } from 'lucide-react-native';
import { Venue } from "@/types/venue";

type VenueCardProps = {
  venue: Venue;
};

const formatPriceTier = (tier?: string | null) => {
  if (!tier) return '$$';
  const count = parseInt(tier) || 2;
  return '$'.repeat(Math.min(Math.max(count, 1), 4));
};

const formatRating = (rating?: number | null) => {
  if (!rating) return 4.5;
  return Math.min(Math.max(rating, 1), 5);
};

export default function VenueCard({ venue }: VenueCardProps) {
  const router = useRouter();

  const openVenueDetails = () => {
    router.push(`/venue/${venue.id}`);
  };

  const placeholderUri = 'https://r2-pub.rork.com/generated-images/bf7a4726-9838-4df5-a0d2-7f6d08b2a711.png';
  const imageSource = venue.image_url ? { uri: venue.image_url } : { uri: placeholderUri };
  const rating = formatRating(venue.rating);
  const priceTier = formatPriceTier(venue.price_tier);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={openVenueDetails}
      activeOpacity={0.9}
      testID={`venue-card-${venue.id}`}
    >
      <ImageBackground
        source={imageSource}
        style={styles.imageContainer}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />

        {/* City pill */}
        <View style={styles.cityPill}>
          <Text style={styles.cityText}>Budapest</Text>
        </View>

        {/* Free drink badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Ingyen Ital Elérhető</Text>
          </View>
        </View>

        {/* Content overlay */}
        <View style={styles.contentOverlay}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.name}
          </Text>
          
          <TouchableOpacity style={styles.pointsButton} activeOpacity={0.7}>
            <Star size={14} color="#00D4FF" fill="#00D4FF" />
            <Text style={styles.pointsText}>Szerezz pontokat</Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {venue.category || 'Pub'} • {venue.address || 'Budapest'}
            </Text>
            
            <View style={styles.rightInfo}>
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    color={i < rating ? '#FFD700' : '#444'}
                    fill={i < rating ? '#FFD700' : 'transparent'}
                  />
                ))}
              </View>
              <Text style={styles.priceText}>{priceTier}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    height: 280,
    width: '100%',
    position: 'relative' as const,
  },
  gradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  cityPill: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  badgeContainer: {
    position: 'absolute' as const,
    bottom: 100,
    left: 16,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  contentOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pointsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#00D4FF',
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  bottomRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  categoryText: {
    fontSize: 13,
    color: '#AABBCC',
    flex: 1,
    marginRight: 8,
  },
  rightInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  priceText: {
    fontSize: 13,
    color: '#AABBCC',
    fontWeight: '500' as const,
  },
});