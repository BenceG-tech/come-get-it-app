import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
      stars.push(<Star key={i} size={14} color="#FFD84D" fill="#FFD84D" />);
    }
    return stars;
  };

  // Generate price tier display
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
      {/* Image section with overlays */}
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Gradient overlay at bottom of image */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={styles.imageGradient}
        />
        
        {/* City chip - top left */}
        <View style={styles.cityPill}>
          <Text style={styles.cityPillText}>Budapest</Text>
        </View>
        
        {/* Free drink badge - bottom right */}
        <View style={styles.freeDrinkBadge}>
          <View style={styles.badgeIcon}>
            <Text style={styles.badgeIconText}>FIRST</Text>
          </View>
          <Text style={styles.freeDrinkText}>Ingyen Ital Elérhető</Text>
        </View>
      </View>
      
      {/* Content section below image */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.venueName} numberOfLines={1}>
          {venue.name}
        </Text>
        
        {/* Meta row 1: Earn points link + Rating */}
        <View style={styles.metaRow}>
          <TouchableOpacity style={styles.earnPointsButton}>
            <Text style={styles.earnPointsText}>⭐ Szerezz pontokat</Text>
          </TouchableOpacity>
          <View style={styles.stars}>
            {renderStars()}
          </View>
        </View>
        
        {/* Meta row 2: Category/Address + Price */}
        <View style={styles.metaRow}>
          <Text style={styles.subtitle} numberOfLines={1}>
            Pub • Ingyen ital • Pontszerzés
          </Text>
          <Text style={styles.priceTier}>
            {getPriceTier()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0B0B',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  cityPill: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#111',
  },
  freeDrinkBadge: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  badgeIconText: {
    fontSize: 8,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  freeDrinkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  venueName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginTop: 4,
  },
  earnPointsButton: {
    paddingVertical: 2,
  },
  earnPointsText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#00B5FF',
  },
  stars: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#A7A7A7',
  },
  priceTier: {
    fontSize: 14,
    color: '#A7A7A7',
    fontWeight: '500' as const,
  },
});