import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { useRouter } from "expo-router";
import { Venue } from "@/types/venue";
import { LinearGradient } from 'expo-linear-gradient';
import OpeningHoursDisplay from '@/components/OpeningHoursDisplay';
import { convertOpeningHoursToBusinessHours } from '@/utils/openingHours';
import Colors from '@/constants/colors';
import { useFavorites } from '@/context/FavoritesContext';

type VenueCardProps = {
  venue: Venue;
  showRating?: boolean;
};

export default function VenueCard({ venue, showRating = true }: VenueCardProps) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width: screenWidth } = useWindowDimensions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const cardWidth = screenWidth;
  const favorite = isFavorite(String(venue.id));
  const priceLevel = getVenuePriceLevel(venue);

  const openVenueDetails = () => {
    router.push(`/venue/${encodeURIComponent(String(venue.id))}`);
  };

  const handleFavoritePress = async (event: GestureResponderEvent) => {
    event.stopPropagation();
    await toggleFavorite(String(venue.id));
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

  const renderPriceMarkers = () => {
    return Array.from({ length: 4 }, (_, index) => (
      <Text key={`price-${index}`} style={[styles.priceMarker, index >= priceLevel && styles.priceMarkerMuted]}>
        $
      </Text>
    ));
  };

  // Generate rating display - always show 5 stars for now
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(<Star key={i} size={14} color="#FFD646" fill="#FFD646" />);
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
      <View style={[styles.imageContainer, { height: Math.round(cardWidth * 0.42) }]}>
        <View style={styles.imageClip}>
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
        </View>
        
        {/* City chip - top left */}
        <View style={styles.cityPill}>
          <Text style={styles.cityPillText}>Budapest</Text>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={favorite ? `${venue.name} eltávolítása a kedvencekből` : `${venue.name} hozzáadása a kedvencekhez`}
          testID={`favorite-toggle-${venue.id}`}
        >
          <Heart size={20} color="#00D1FF" fill={favorite ? "#00D1FF" : "transparent"} />
        </TouchableOpacity>
        
        {/* Free drink badge - overhangs the bottom edge of the image */}
        <View style={styles.freeDrinkBadge}>
          <Text style={styles.freeDrinkText}>Ingyen Ital Elérhető</Text>
        </View>
      </View>
      
      {/* Content section below image */}
      <View style={styles.contentContainer}>
        {/* Title row with rating stars right-aligned */}
        <View style={styles.titleRow}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.stars}>
            {renderStars()}
          </View>
        </View>
        
        {/* Szerezz pontokat row with price markers right-aligned */}
        <View style={styles.earnPointsRow}>
          <View style={styles.earnPointsContent}>
            <Star size={14} color="#2BB7FF" fill="#2BB7FF" />
            <Text style={styles.earnPointsText}>Szerezz pontokat</Text>
          </View>
          <View style={styles.priceRow} accessibilityLabel={`Árkategória: ${priceLevel} / 4`}>
            {renderPriceMarkers()}
          </View>
        </View>
        
        {/* Tags row */}
        <View style={styles.tagsRow}>
          {venue.tags && venue.tags.length > 0 ? (
            <Text style={styles.tagsText} numberOfLines={1} ellipsizeMode="tail">
              {venue.tags.join(' • ')}
            </Text>
          ) : null}
        </View>
        
        {/* Meta row with opening hours */}
        <View style={styles.metaRow}>
          <OpeningHoursDisplay 
            businessHours={venue.opening_hours ? convertOpeningHoursToBusinessHours(venue.opening_hours) : null}
            showStatus={Boolean(venue.opening_hours)} 
            compact 
            style={styles.openingHoursStyle} 
          />
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}



function getVenuePriceLevel(venue: Venue): number {
  const raw = venue.price_level ?? venue.priceLevel;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.min(4, Math.round(raw)));

  if (venue.plan === 'premium') return 4;
  if (venue.plan === 'standard') return 3;

  const text = `${venue.name ?? ''} ${(venue.tags ?? []).join(' ')}`.toLowerCase();
  if (text.includes('vip') || text.includes('rooftop') || text.includes('fine')) return 4;
  if (text.includes('wine') || text.includes('cocktail') || text.includes('bar')) return 3;
  if (text.includes('pub') || text.includes('bistro')) return 2;
  return 2;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E0E10',
    marginHorizontal: 0, // Edge-to-edge
    marginBottom: 10,
    borderRadius: 0, // No border radius for edge-to-edge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    position: 'relative' as const,
  },
  imageClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden' as const,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 0, // No radius for edge-to-edge
    borderTopRightRadius: 0,
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
    top: 10,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cityPillText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 8,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  freeDrinkBadge: {
    position: 'absolute' as const,
    bottom: -14,
    right: 14,
    zIndex: 2,
    backgroundColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  freeDrinkText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 18, // Space so the overhanging badge doesn't cover the venue name
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: 3,
  },
  venueName: {
    fontSize: 19,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
  },
  earnPointsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  earnPointsContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  earnPointsText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#2BB7FF',
  },
  tagsRow: {
    marginBottom: 3,
  },
  tagsText: {
    fontSize: 12,
    color: '#A6A6AD',
  },
  stars: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    gap: 2,
  },
  priceMarker: {
    color: '#2BB7FF',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  priceMarkerMuted: {
    color: 'rgba(43, 183, 255, 0.22)',
  },
  metaRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    gap: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#A6A6AD',
    lineHeight: 18,
    flex: 1,
  },
  openingHoursStyle: {
    color: Colors.textSecondary,
  },
});