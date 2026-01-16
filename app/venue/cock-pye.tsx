import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { ChevronDown, Navigation, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/lib/mapComponents';

type CarouselImage = {
  id: string;
  uri: string;
  alt: string;
};

type Badge = {
  id: string;
  label: string;
  tone: 'cyan' | 'neutral' | 'gold';
};

const VENUE_NAME = 'Cock & Pye';
const VENUE_ADDRESS = '13 Upper Brook Street, IP4 1EG';

export default function CockPyeVenueDetailScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hoursExpanded, setHoursExpanded] = useState<boolean>(false);

  const carouselRef = useRef<ScrollView>(null);

  const images = useMemo<CarouselImage[]>(
    () => [
      {
        id: '1',
        uri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&auto=format&fit=crop&q=80',
        alt: 'Bar interior',
      },
      {
        id: '2',
        uri: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1600&auto=format&fit=crop&q=80',
        alt: 'Pub counter',
      },
      {
        id: '3',
        uri: 'https://images.unsplash.com/photo-1527169402691-a3fb1cbe8b61?w=1600&auto=format&fit=crop&q=80',
        alt: 'Cocktail closeup',
      },
    ],
    []
  );

  const badges = useMemo<Badge[]>(
    () => [
      { id: 'earn', label: 'Earn Points', tone: 'cyan' },
      { id: 'pub', label: 'Pub', tone: 'neutral' },
      { id: 'value', label: 'Good Value', tone: 'neutral' },
      { id: 'reward', label: 'Reward Bar', tone: 'gold' },
    ],
    []
  );

  const onCarouselScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / Math.max(1, width));
      if (Number.isFinite(next) && next !== activeIndex) {
        console.log('[CockPye] Carousel index:', next);
        setActiveIndex(next);
      }
    },
    [activeIndex, width]
  );

  const openDirections = useCallback(async () => {
    console.log('[CockPye] openDirections pressed');

    const encoded = encodeURIComponent(`${VENUE_NAME}, ${VENUE_ADDRESS}`);

    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${encoded}`
        : `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    try {
      const can = await Linking.canOpenURL(url);
      console.log('[CockPye] canOpenURL:', can, url);
      if (!can) return;
      await Linking.openURL(url);
    } catch (err) {
      console.error('[CockPye] openDirections failed:', err);
    }
  }, []);

  const toggleHours = useCallback(() => {
    setHoursExpanded((v) => {
      const next = !v;
      console.log('[CockPye] hoursExpanded:', next);
      return next;
    });
  }, []);

  const mapRegion = useMemo(
    () => ({
      latitude: 52.0567,
      longitude: 1.1482,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    []
  );

  const bottomPad = Math.max(12, insets.bottom + 10);

  return (
    <View style={styles.screen} testID="cockPyeScreen">
      <Stack.Screen
        options={{
          title: 'Venue',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 104 + bottomPad }]}
        showsVerticalScrollIndicator={false}
        testID="cockPyeScroll"
      >
        <View style={styles.carouselWrap} testID="cockPyeCarousel">
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            testID="cockPyeCarouselScroll"
          >
            {images.map((img) => (
              <View key={img.id} style={[styles.slide, { width }]}>
                <Image
                  source={{ uri: img.uri }}
                  style={[styles.slideImage, { width }]}
                  resizeMode="cover"
                  accessibilityLabel={img.alt}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.nameOverlay} pointerEvents="none" testID="cockPyeNameOverlay">
            <Text style={styles.venueName}>{VENUE_NAME}</Text>
          </View>

          <View style={styles.dotsRow} pointerEvents="none" testID="cockPyeDots">
            {images.map((img, idx) => (
              <View
                key={img.id}
                style={[styles.dot, idx === activeIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgeRow}
          testID="cockPyeBadges"
        >
          {badges.map((b) => (
            <View
              key={b.id}
              style={[
                styles.badge,
                b.tone === 'cyan' ? styles.badgeCyan : null,
                b.tone === 'gold' ? styles.badgeGold : null,
              ]}
              testID={`cockPyeBadge-${b.id}`}
            >
              <Text
                style={[
                  styles.badgeText,
                  b.tone === 'cyan' ? styles.badgeTextCyan : null,
                  b.tone === 'gold' ? styles.badgeTextGold : null,
                ]}
              >
                {b.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.heroCard} testID="cockPyeEarnCard">
          <View style={styles.heroCardIcon}>
            <Star size={18} color={Colors.primary} />
          </View>
          <View style={styles.heroCardBody}>
            <Text style={styles.heroCardTitle}>EARN POINTS HERE</Text>
            <Text style={styles.heroCardDesc}>
              Link your card once and automatically collect points every time you pay at this venue.
            </Text>
          </View>
        </View>

        <View style={styles.section} testID="cockPyeAbout">
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionText}>
            A cosy neighbourhood pub with warm lighting, crisp pints, and a relaxed late-night vibe. Ideal for casual
            catch-ups, quick drinks, and reward-earning visits.
          </Text>
        </View>

        <Pressable
          onPress={toggleHours}
          style={styles.statusRow}
          testID="cockPyeStatusRow"
          accessibilityRole="button"
          accessibilityLabel="Opening hours"
        >
          <View style={styles.statusLeft}>
            <View style={styles.statusPill} testID="cockPyeStatusPill">
              <View style={[styles.statusDot, styles.statusDotClosed]} />
              <Text style={styles.statusPillText}>Closed</Text>
            </View>
            <Text style={styles.statusHint}>Tap for opening hours</Text>
          </View>
          <ChevronDown size={18} color={Colors.textSecondary} />
        </Pressable>

        {hoursExpanded ? (
          <View style={styles.hoursCard} testID="cockPyeHours">
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Mon–Thu</Text>
              <Text style={styles.hoursTime}>16:00–23:00</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Fri</Text>
              <Text style={styles.hoursTime}>14:00–01:00</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Sat</Text>
              <Text style={styles.hoursTime}>12:00–01:00</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Sun</Text>
              <Text style={styles.hoursTime}>12:00–22:00</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section} testID="cockPyeMap">
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>Map</Text>
            <Text style={styles.mapAddress}>{VENUE_ADDRESS}</Text>
          </View>

          <View style={styles.mapCard} testID="cockPyeMapCard">
            {MapView ? (
              <MapView
                style={styles.map}
                initialRegion={mapRegion}
                provider={PROVIDER_GOOGLE}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
                loadingEnabled
                testID="cockPyeMapNative"
              >
                <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
              </MapView>
            ) : (
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1520962917965-4dc2a9a9e83a?w=1600&auto=format&fit=crop&q=70',
                }}
                style={styles.map}
                resizeMode="cover"
                accessibilityLabel="Map preview"
                testID="cockPyeMapWebFallback"
              />
            )}

            <View style={styles.mapOverlay} pointerEvents="none">
              <View style={styles.mapOverlayPill}>
                <Text style={styles.mapOverlayText}>Map preview</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.bottomBar, { paddingBottom: bottomPad }]}
        testID="cockPyeBottomBar"
        pointerEvents="box-none"
      >
        <Pressable
          onPress={openDirections}
          style={({ pressed }) => [styles.directionsBtn, pressed ? styles.directionsBtnPressed : null]}
          testID="cockPyeDirectionsBtn"
          accessibilityRole="button"
          accessibilityLabel="Get directions"
        >
          <Navigation size={18} color={Colors.text} />
          <Text style={styles.directionsBtnText}>Get directions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  carouselWrap: {
    width: '100%',
    height: 320,
    backgroundColor: '#0B0F12',
  },
  slide: {
    height: 320,
  },
  slideImage: {
    height: 320,
    opacity: 0.98,
  },
  nameOverlay: {
    position: 'absolute',
    left: 16,
    bottom: 18,
    right: 16,
  },
  venueName: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  dotsRow: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  badgeRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badgeCyan: {
    borderColor: 'rgba(0,209,255,0.35)',
    backgroundColor: 'rgba(0,209,255,0.10)',
  },
  badgeGold: {
    borderColor: 'rgba(255,200,97,0.38)',
    backgroundColor: 'rgba(255,200,97,0.10)',
  },
  badgeText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextCyan: {
    color: Colors.primary,
  },
  badgeTextGold: {
    color: '#FFC861',
  },

  heroCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.20)',
    backgroundColor: 'rgba(0,209,255,0.08)',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  heroCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroCardBody: {
    flex: 1,
  },
  heroCardTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  heroCardDesc: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionText: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  statusRow: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flex: 1,
    paddingRight: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusDotClosed: {
    backgroundColor: '#FF4D4D',
  },
  statusPillText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  statusHint: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  hoursCard: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
    gap: 10,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursDay: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  hoursTime: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '700',
  },

  mapHeader: {
    gap: 6,
  },
  mapAddress: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  mapCard: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#101417',
  },
  map: {
    width: '100%',
    height: 170,
  },
  mapOverlay: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  mapOverlayPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  mapOverlayText: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '700',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  directionsBtn: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#0F171B',
    borderWidth: 1,
    borderColor: 'rgba(0,209,255,0.30)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  directionsBtnPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: '#0B1216',
  },
  directionsBtnText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
