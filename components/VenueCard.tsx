import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Star } from 'lucide-react-native';
import { useRouter } from "expo-router";
import { Venue } from "@/types/venue";
import { LinearGradient } from 'expo-linear-gradient';

type VenueCardProps = {
  venue: Venue;
  showRating?: boolean;
};

export default function VenueCard({ venue, showRating = true }: VenueCardProps) {
  const router = useRouter();

  const openVenueDetails = () => {
    router.push(`/venue/${venue.id}`);
  };

  const placeholderUri = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600';
  const imageSource = venue.image_url ? { uri: venue.image_url } : { uri: placeholderUri };

  // Generate rating display - always show 5 stars for now
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(<Star key={i} size={16} color="#FFD700" fill="#FFD700" />);
    }
    return stars;
  };

  // Generate price tier display - default to $
  const getPriceTier = () => {
    return '$··';
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={openVenueDetails}
      activeOpacity={0.95}
      testID={`venue-card-${venue.id}`}
    >
      <ImageBackground
        source={imageSource}
        style={styles.imageBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          {/* Top badges */}
          <View style={styles.topBadges}>
            <View style={styles.cityPill}>
              <Text style={styles.cityPillText}>Budapest</Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.bottomContent}>
            {/* Free drink badge */}
            <View style={styles.freeDrinkBadge}>
              <Text style={styles.freeDrinkText}>Ingyen Ital Elérhető</Text>
            </View>

            {/* Venue info */}
            <View style={styles.venueInfo}>
              <Text style={styles.venueName} numberOfLines={1}>
                {venue.name}
              </Text>
              
              {/* Rating and earn points row */}
              <View style={styles.ratingRow}>
                <View style={styles.stars}>
                  {renderStars()}
                </View>
                <TouchableOpacity style={styles.earnPointsButton}>
                  <Text style={styles.earnPointsText}>★ Szerezz pontokat</Text>
                </TouchableOpacity>
              </View>

              {/* Category and address */}
              <Text style={styles.subtitle} numberOfLines={1}>
                Pub • {venue.address || 'Budapest teszt utca'}
              </Text>

              {/* Price tier */}
              <Text style={styles.priceTier}>
                {getPriceTier()}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  topBadges: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start' as const,
  },
  cityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  bottomContent: {
    gap: 12,
  },
  freeDrinkBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start' as const,
  },
  freeDrinkText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  venueInfo: {
    gap: 6,
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ratingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between',
  },
  stars: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  earnPointsButton: {
    paddingVertical: 4,
  },
  earnPointsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#00D4FF',
  },
  subtitle: {
    fontSize: 14,
    color: '#AABBCC',
    marginTop: 2,
  },
  priceTier: {
    fontSize: 14,
    color: '#AABBCC',
    marginTop: 2,
  },
});