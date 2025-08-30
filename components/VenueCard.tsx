import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const openVenueDetails = () => {
    router.push(`/venue/${venue.id}`);
  };

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const placeholderUri = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600';
  const imageSource = venue.image_url ? { uri: venue.image_url } : { uri: placeholderUri };

  // Generate rating display - always show 5 stars for now
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(<Star key={i} size={16} color="#FFD646" fill="#FFD646" />);
    }
    return stars;
  };



  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={styles.container} 
        onPress={openVenueDetails}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`${venue.name} kártya`}
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
          colors={['transparent', 'rgba(0,0,0,0.4)']}
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
        {/* Title row with rating */}
        <View style={styles.titleRow}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.stars}>
            {renderStars()}
          </View>
        </View>
        
        {/* Blue action row */}
        <TouchableOpacity style={styles.earnPointsButton} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.earnPointsText}>⭐ Szerezz pontokat</Text>
        </TouchableOpacity>
        
        {/* Meta row */}
        <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
          Pub • {venue.address || 'Budapest'} • Pontszerzés
        </Text>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 32; // 16px padding on each side

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E0E10',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: Math.round(cardWidth * 9 / 16),
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
    borderRadius: 20,
  },
  cityPillText: {
    fontSize: 12.5,
    fontWeight: '500' as const,
    color: '#111',
  },
  freeDrinkBadge: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(17, 17, 17, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD646',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  badgeIconText: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  freeDrinkText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  contentContainer: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  venueName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
  },
  earnPointsButton: {
    marginBottom: 6,
  },
  earnPointsText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#2BB7FF',
  },
  stars: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#A6A6AD',
    lineHeight: 18,
  },
});