import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Animated,
  PanResponder,
  type LayoutChangeEvent,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Pressable } from "react-native";
import { Search, MapPin, Filter, Heart, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import VenueCard from "@/components/VenueCard";
import DarkMapPreview from "@/components/DarkMapPreview";
import VenueMiniCard from "@/components/VenueMiniCard";
import { Venue } from "@/types/venue";
import { fetchVenueCoverUrl, fetchVenues } from "@/lib/venueService";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { getUserCSRImpact } from "@/lib/csrService";

const COLLAPSED_VISIBLE_HEIGHT = 88 as const;
const LOGO_ASPECT_RATIO = 3.5 as const;
const LOGO_CROP_LEFT_FRACTION = 0.315 as const;
const LOGO_CROP_VERTICAL_FRACTION = 0.3 as const;
const LOGO_SCALE = 1.22 as const; // ~22% nagyobb logó

type SnapState = "expanded" | "half" | "collapsed";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function BarsScreen() {
  const router = useRouter();
  const { selectedFilters, setSelectedFilters } = useAppContext();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [snapState, setSnapState] = useState<SnapState>("half");
  const [previewVenue, setPreviewVenue] = useState<Venue | null>(null);

  const { data: csrData } = useQuery({
    queryKey: ["csr-impact"],
    queryFn: async () => {
      const result = await getUserCSRImpact();
      if (!result.success) return null;
      return result.data;
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  const logoUri = useMemo(
    () => "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/orb6kvp9n7wts6gddeitn",
    []
  );
  const iconSize = width <= 375 ? 20 : 22;
  const logoBoxHeight = Math.round((width <= 375 ? 34 : 38) * LOGO_SCALE);
  const logoDrawHeight = Math.round(logoBoxHeight / (1 - LOGO_CROP_VERTICAL_FRACTION));
  const logoDrawWidth = Math.round(logoDrawHeight * LOGO_ASPECT_RATIO);
  const logoCropLeft = Math.round(logoDrawWidth * LOGO_CROP_LEFT_FRACTION);
  const logoBoxWidth = logoDrawWidth - logoCropLeft;

  const expandedTop = insets.top + 8;
  const halfOffset = Math.max(0, Math.round(containerHeight * 0.5) - expandedTop);
  const collapsedOffset = Math.max(0, containerHeight - expandedTop - COLLAPSED_VISIBLE_HEIGHT);

  const translateY = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef<number>(0);
  const snapPointsRef = useRef<{ half: number; collapsed: number }>({ half: 0, collapsed: 0 });
  const snapStateRef = useRef<SnapState>("half");
  const scrollOffsetRef = useRef<number>(0);

  useEffect(() => {
    snapPointsRef.current = { half: halfOffset, collapsed: collapsedOffset };
    const current = snapStateRef.current;
    const to = current === "expanded" ? 0 : current === "half" ? halfOffset : collapsedOffset;
    offsetRef.current = to;
    translateY.setValue(to);
  }, [halfOffset, collapsedOffset, translateY]);

  const snapTo = useCallback(
    (state: SnapState) => {
      const points = snapPointsRef.current;
      const to = state === "expanded" ? 0 : state === "half" ? points.half : points.collapsed;
      offsetRef.current = to;
      snapStateRef.current = state;
      setSnapState(state);
      Animated.spring(translateY, {
        toValue: to,
        useNativeDriver: true,
        stiffness: 170,
        damping: 22,
        mass: 0.7,
      }).start();
    },
    [translateY]
  );

  const panResponder = useMemo(() => {
    const shouldTake = (dy: number, dx: number): boolean => {
      if (Math.abs(dy) < 6 || Math.abs(dy) <= Math.abs(dx)) return false;
      if (snapStateRef.current !== "expanded") return true;
      return dy > 0 && scrollOffsetRef.current <= 1;
    };

    const release = (dy: number, vy: number) => {
      const points = snapPointsRef.current;
      const current = clamp(offsetRef.current + dy, 0, points.collapsed);
      let target: SnapState;
      if (vy > 0.5) {
        target = snapStateRef.current === "expanded" ? "half" : "collapsed";
      } else if (vy < -0.5) {
        target = snapStateRef.current === "collapsed" ? "half" : "expanded";
      } else {
        const candidates: { state: SnapState; value: number }[] = [
          { state: "expanded", value: 0 },
          { state: "half", value: points.half },
          { state: "collapsed", value: points.collapsed },
        ];
        target = candidates.reduce((best, c) =>
          Math.abs(c.value - current) < Math.abs(best.value - current) ? c : best
        ).state;
      }
      snapTo(target);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, g) => shouldTake(g.dy, g.dx),
      onMoveShouldSetPanResponderCapture: (_evt, g) => shouldTake(g.dy, g.dx),
      onPanResponderMove: (_evt, g) => {
        const next = clamp(offsetRef.current + g.dy, 0, snapPointsRef.current.collapsed);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_evt, g) => {
        release(g.dy, g.vy);
      },
      onPanResponderTerminate: () => {
        snapTo(snapStateRef.current);
      },
    });
  }, [snapTo, translateY]);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight((prev) => (prev === height ? prev : height));
  }, []);

  const loadVenues = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      console.log("[Home] Fetching venues...");
      const rows = await fetchVenues({ orderByCreated: true });
      console.log("[Home] Venues fetched:", rows.length);

      const venuesWithImages = await Promise.all(
        rows.map(async (venue: Venue) => {
          if (venue.image_url || venue.hero_image_url) return venue;

          const coverUrl = await fetchVenueCoverUrl(venue.id);
          return coverUrl ? { ...venue, image_url: coverUrl } : venue;
        })
      );

      setVenues(venuesWithImages);
    } catch (error) {
      console.error("[Home] Error fetching venues:", error);
      setErrorMsg("Nem sikerült betölteni a helyszíneket. Próbáld újra pár másodperc múlva.");
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues().catch((error) => {
      console.error("[Home] loadVenues crashed:", error);
    });
  }, [loadVenues]);

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      if (selectedFilters.length === 0) return true;
      let passesFilters = true;
      if (selectedFilters.includes("nyitva")) {
        passesFilters = passesFilters && true;
      }
      if (selectedFilters.includes("ingyen-ital")) {
        passesFilters = passesFilters && true;
      }
      return passesFilters;
    });
  }, [selectedFilters, venues]);

  const mapVenues = useMemo(
    () => (filteredVenues.length > 0 ? filteredVenues : venues),
    [filteredVenues, venues]
  );

  const openFilter = () => {
    router.push("/filter");
  };

  const openMap = () => {
    router.push("/map");
  };

  const openSearch = () => {
    router.push("/search");
  };

  const onMarkerPress = useCallback((venue: Venue) => {
    console.log("[Home] Marker pressed, showing mini card:", venue.id);
    setPreviewVenue(venue);
  }, []);

  const onMiniCardDetails = useCallback(
    (venue: Venue) => {
      setPreviewVenue(null);
      router.push(`/venue/${venue.id}` as never);
    },
    [router]
  );

  const panelHeight = Math.max(0, containerHeight - expandedTop);

  const visibleMapHeight =
    snapState === "half"
      ? halfOffset + expandedTop
      : containerHeight - Math.max(0, containerHeight - expandedTop - collapsedOffset);
  const mapControlsOffset =
    snapState === "half"
      ? Math.max(0, containerHeight - visibleMapHeight) + 16
      : COLLAPSED_VISIBLE_HEIGHT + 16;

  return (
    <View style={styles.container} testID="home-root" onLayout={onContainerLayout}>
      <StatusBar style="light" />

      <DarkMapPreview
        venues={mapVenues}
        zoom={13}
        style={StyleSheet.absoluteFillObject}
        onMarkerPress={onMarkerPress}
        interactive={snapState !== "expanded"}
        controlsBottomOffset={mapControlsOffset}
        testID="home-fullscreen-map"
      />

      <View style={[styles.mapTopRow, { top: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.mapCountPill}>
          <MapPin size={13} color="#00D1FF" />
          <Text style={styles.mapCountPillText}>{mapVenues.length} hely a közeledben</Text>
        </View>
        <TouchableOpacity
          testID="home-map"
          onPress={openMap}
          style={styles.mapExpandButton}
          activeOpacity={0.8}
        >
          <MapPin size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {containerHeight > 0 && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sheet,
            {
              top: expandedTop,
              height: panelHeight,
              transform: [{ translateY }],
            },
          ]}
          testID="home-sheet"
        >
          <Pressable
            onPress={() => {
              if (snapStateRef.current === "collapsed") snapTo("half");
            }}
            style={styles.headerRow}
            testID="home-sheet-header"
          >
            <View
              style={[
                styles.logoCropBox,
                { width: logoBoxWidth, height: logoBoxHeight },
              ]}
            >
              <Image
                source={{ uri: logoUri }}
                accessibilityLabel="Come Get It logo"
                style={[
                  styles.brandLogo,
                  {
                    width: logoDrawWidth,
                    height: logoDrawHeight,
                    left: -logoCropLeft,
                    top: -Math.round((logoDrawHeight - logoBoxHeight) / 2),
                  },
                ]}
              />
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                testID="home-search"
                onPress={openSearch}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Search size={iconSize} color="#EAEAEA" />
              </TouchableOpacity>
            </View>
          </Pressable>

          <View style={styles.filtersContainer}>
            <View style={styles.filtersContent}>
              <TouchableOpacity
                testID="chip-nyitva"
                style={[
                  styles.filterPill,
                  selectedFilters.includes("nyitva") && styles.filterPillActive,
                ]}
                onPress={() => {
                  const newFilters = selectedFilters.includes("nyitva")
                    ? selectedFilters.filter((f) => f !== "nyitva")
                    : [...selectedFilters, "nyitva"];
                  setSelectedFilters(newFilters);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedFilters.includes("nyitva") && styles.filterPillTextActive,
                  ]}
                >
                  NYITVA
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="chip-free"
                style={[
                  styles.filterPill,
                  selectedFilters.includes("ingyen-ital") && styles.filterPillActive,
                ]}
                onPress={() => {
                  const newFilters = selectedFilters.includes("ingyen-ital")
                    ? selectedFilters.filter((f) => f !== "ingyen-ital")
                    : [...selectedFilters, "ingyen-ital"];
                  setSelectedFilters(newFilters);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedFilters.includes("ingyen-ital") && styles.filterPillTextActive,
                  ]}
                >
                  Ingyen ital elérhető
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="chip-filters"
                style={styles.filterButton}
                onPress={openFilter}
                activeOpacity={0.7}
              >
                <Filter size={width <= 375 ? 16 : 18} color="rgba(234,234,234,0.7)" />
                <Text style={styles.filterButtonText}>Szűrők</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.ScrollView
            style={styles.venuesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.venuesContent}
            scrollEnabled={snapState === "expanded"}
            scrollEventThrottle={16}
            onScroll={(event) => {
              scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            bounces={false}
          >
            {session && (csrData?.stats?.total_impact_units ?? 0) > 0 && (
              <TouchableOpacity
                style={styles.impactWidget}
                onPress={() => router.push("/my-impact")}
                activeOpacity={0.85}
                testID="impact-widget"
              >
                <View style={styles.impactWidgetContent}>
                  <View style={styles.impactWidgetHeader}>
                    <Heart size={16} color="#1fb1b7" />
                    <Text style={styles.impactWidgetTitle}>A Te Hatásod Ezen a Héten</Text>
                  </View>
                  <View style={styles.impactWidgetStats}>
                    <View style={styles.impactWidgetStat}>
                      <Text style={styles.impactWidgetEmoji}>🍽️</Text>
                      <Text style={styles.impactWidgetValue}>
                        {csrData?.stats?.total_impact_units ?? 0}
                      </Text>
                      <Text style={styles.impactWidgetLabel}>adag</Text>
                    </View>
                    {(csrData?.stats?.current_streak_days ?? 0) > 0 && (
                      <View style={styles.impactWidgetStat}>
                        <Text style={styles.impactWidgetEmoji}>🔥</Text>
                        <Text style={styles.impactWidgetValue}>
                          {csrData?.stats?.current_streak_days ?? 0}
                        </Text>
                        <Text style={styles.impactWidgetLabel}>napos</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.impactWidgetArrow}>
                  <Text style={styles.impactWidgetLink}>Részletek</Text>
                  <ChevronRight size={16} color="#1fb1b7" />
                </View>
              </TouchableOpacity>
            )}

            {loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Betöltés...</Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.emptyState} testID="home-error">
                <Text style={styles.emptyStateText}>{errorMsg}</Text>
                <TouchableOpacity
                  testID="home-retry"
                  onPress={() => {
                    console.log("[Home] retry pressed");
                    loadVenues().catch((e) => console.error("[Home] retry crashed", e));
                  }}
                  style={styles.retryBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.retryBtnText}>Újrapróbálás</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {filteredVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}

                {filteredVenues.length === 0 && !loading && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Nincs találat</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Próbálj meg más szűrőket vagy keresési kifejezést
                    </Text>
                  </View>
                )}
              </>
            )}
          </Animated.ScrollView>
        </Animated.View>
      )}

      {previewVenue && (
        <VenueMiniCard
          venue={previewVenue}
          onClose={() => setPreviewVenue(null)}
          onDetails={onMiniCardDetails}
          bottomOffset={insets.bottom + 12}
          testID="home-venue-mini-card"
        />
      )}
    </View>
  );
}

const pillRadius = 9999 as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  mapTopRow: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  mapCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.35)",
  },
  mapCountPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  mapExpandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#000000",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    zIndex: 2,
  },
  headerRow: {
    backgroundColor: "#000000",
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 0,
    paddingRight: 4,
    paddingBottom: 0,
  },
  logoCropBox: {
    overflow: "hidden",
  },
  brandLogo: {
    position: "absolute",
    resizeMode: "contain",
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersContainer: {
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 0,
    backgroundColor: "#000000",
  },
  filtersContent: {
    paddingHorizontal: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  filterPill: {
    height: 24,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: pillRadius,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterPillActive: {
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderColor: "rgba(0, 200, 232, 0.5)",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(234,234,234,0.72)",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    paddingHorizontal: 11,
    borderRadius: pillRadius,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 5,
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(234,234,234,0.72)",
  },
  venuesList: {
    flex: 1,
  },
  venuesContent: {
    paddingTop: 0,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0DD0FF",
  },
  retryBtnText: {
    color: "#001014",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  impactWidget: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: "rgba(31, 177, 183, 0.1)",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(31, 177, 183, 0.25)",
  },
  impactWidgetContent: {
    flex: 1,
  },
  impactWidgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  impactWidgetTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  impactWidgetStats: {
    flexDirection: "row",
    gap: 20,
  },
  impactWidgetStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  impactWidgetEmoji: {
    fontSize: 16,
  },
  impactWidgetValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1fb1b7",
  },
  impactWidgetLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  impactWidgetArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  impactWidgetLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1fb1b7",
  },
});
