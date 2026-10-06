import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronRight, MapPin, Martini, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Venue } from '@/types/venue';
import RemoteImage from '@/components/RemoteImage';
import { hasAvailableFreeDrink } from '@/lib/offerAvailability';
import { useAvailabilityNow } from '@/lib/useAvailabilityNow';

const CYAN = '#00D1FF' as const;

type VenueMiniCardProps = {
  venue: Venue;
  onClose: () => void;
  onDetails: (venue: Venue) => void;
  bottomOffset?: number;
  testID?: string;
};

/**
 * Compact bottom preview card shown when a map marker is tapped.
 * Springs in from the bottom; swipe down or tap X to dismiss.
 */
export default function VenueMiniCard({
  venue,
  onClose,
  onDetails,
  bottomOffset = 16,
  testID,
}: VenueMiniCardProps) {
  const translateY = useRef(new Animated.Value(220)).current;
  const availabilityNow = useAvailabilityNow();
  const available = hasAvailableFreeDrink(venue, availabilityNow);

  useEffect(() => {
    translateY.setValue(220);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      stiffness: 210,
      damping: 24,
      mass: 0.8,
    }).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [venue.id, translateY]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: 260,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_evt, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_evt, g) => {
          if (g.dy > 60 || g.vy > 0.5) {
            dismiss();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              stiffness: 220,
              damping: 22,
            }).start();
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [translateY]
  );

  const tags = Array.isArray(venue.tags) ? venue.tags.slice(0, 3) : [];

  return (
    <Animated.View
      style={[styles.wrap, { bottom: bottomOffset, transform: [{ translateY }] }]}
      testID={testID ?? 'venue-mini-card'}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={() => onDetails(venue)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${venue.name} részletei`}
        testID="venue-mini-card-body"
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>
        <View style={styles.row}>
          <RemoteImage uri={venue.image_url} fallbackUris={[venue.hero_image_url]} style={styles.image} size={480} accessibilityLabel={`${venue.name} fotója`} />
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>{venue.name}</Text>
            {venue.address ? (
              <View style={styles.addressRow}>
                <MapPin size={12} color="rgba(255,255,255,0.55)" />
                <Text style={styles.address} numberOfLines={1}>{venue.address}</Text>
              </View>
            ) : null}
            {tags.length > 0 ? (
              <Text style={styles.tags} numberOfLines={1}>{tags.join(' • ')}</Text>
            ) : null}
            {available ? (
              <View style={[styles.drinkBadge, styles.drinkBadgeActive]}>
                <Martini size={12} color={CYAN} />
                <Text style={styles.drinkBadgeTextActive} numberOfLines={1}>Ingyen ital most elérhető</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={18} color={CYAN} />
          </View>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailsText}>Részletek megnyitása</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={dismiss}
        style={styles.closeButton}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Előnézet bezárása"
        testID="venue-mini-card-close"
      >
        <X size={15} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 30,
  },
  card: {
    backgroundColor: 'rgba(10, 12, 16, 0.96)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.28)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  body: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tags: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  drinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  drinkBadgeActive: {
    backgroundColor: 'rgba(0, 209, 255, 0.10)',
    borderColor: 'rgba(0, 209, 255, 0.4)',
  },
  drinkBadgeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  drinkBadgeTextActive: {
    color: CYAN,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 209, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsRow: {
    alignItems: 'center',
    paddingVertical: 9,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  detailsText: {
    color: CYAN,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
