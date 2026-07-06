import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Search, MapPin, Filter, Heart, ChevronRight, Maximize2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import VenueCard from "@/components/VenueCard";
import DarkMapPreview from "@/components/DarkMapPreview";
import { Venue } from "@/types/venue";
import { fetchVenueCoverUrl, fetchVenues } from "@/lib/venueService";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { getUserCSRImpact } from "@/lib/csrService";

export default function BarsScreen() {
  const router = useRouter();
  const { selectedFilters, setSelectedFilters } = useAppContext();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const logoHeight = width <= 375 ? 62 : 72;
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const mapVenues = useMemo(() => (filteredVenues.length > 0 ? filteredVenues : venues), [filteredVenues, venues]);
  const mapHeight = width <= 375 ? 230 : 260;

  const stickyPaddingTop = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [Math.max(0, mapHeight - insets.top - 24), mapHeight],
        outputRange: [0, insets.top],
        extrapolate: "clamp",
      }),
    [scrollY, mapHeight, insets.top]
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

  return (
    <View style={styles.container} testID="home-root">
      <StatusBar style="light" />
      <Animated.ScrollView
        style={styles.venuesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.venuesContent}
        stickyHeaderIndices={[1]}
        snapToOffsets={[0, mapHeight]}
        snapToEnd={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        <TouchableOpacity
          style={[styles.mapHeader, { height: mapHeight }]}
          activeOpacity={0.92}
          onPress={openMap}
          testID="home-map-preview"
        >
          <DarkMapPreview venues={mapVenues} zoom={12} style={StyleSheet.absoluteFillObject} />
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent", "transparent", "#000000"]}
            locations={[0, 0.25, 0.68, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View style={[styles.mapHeaderTopRow, { top: insets.top + 8 }]} pointerEvents="none">
            <View style={styles.mapCountPill}>
              <MapPin size={13} color="#00D1FF" />
              <Text style={styles.mapCountPillText}>{mapVenues.length} hely a közeledben</Text>
            </View>
            <View style={styles.mapExpandButton}>
              <Maximize2 size={15} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.header, { paddingTop: stickyPaddingTop }]}>
          <View style={styles.headerRow}>
            <Image
              source={{ uri: logoUri }}
              accessibilityLabel="Come Get It logo"
              style={[styles.brandLogo, { height: logoHeight }]}
            />
            <View style={styles.headerActions}>
              <TouchableOpacity
                testID="home-search"
                onPress={openSearch}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Search size={iconSize} color="#EAEAEA" />
              </TouchableOpacity>
              <TouchableOpacity testID="home-map" onPress={openMap} style={styles.headerButton} activeOpacity={0.7}>
                <MapPin size={iconSize} color="#EAEAEA" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <View>
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
                <Text style={styles.impactWidgetValue}>{csrData?.stats?.total_impact_units ?? 0}</Text>
                <Text style={styles.impactWidgetLabel}>adag</Text>
              </View>
              {(csrData?.stats?.current_streak_days ?? 0) > 0 && (
                <View style={styles.impactWidgetStat}>
                  <Text style={styles.impactWidgetEmoji}>🔥</Text>
                  <Text style={styles.impactWidgetValue}>{csrData?.stats?.current_streak_days ?? 0}</Text>
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

      <View style={styles.filtersContainer}>
        <View style={styles.filtersContent}>
          {/* filters stay scrollable under the sticky header */}
          <TouchableOpacity
            testID="chip-nyitva"
            style={[styles.filterPill, selectedFilters.includes("nyitva") && styles.filterPillActive]}
            onPress={() => {
              const newFilters = selectedFilters.includes("nyitva")
                ? selectedFilters.filter((f) => f !== "nyitva")
                : [...selectedFilters, "nyitva"];
              setSelectedFilters(newFilters);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, selectedFilters.includes("nyitva") && styles.filterPillTextActive]}>
              NYITVA
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="chip-free"
            style={[styles.filterPill, selectedFilters.includes("ingyen-ital") && styles.filterPillActive]}
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

          <TouchableOpacity testID="chip-filters" style={styles.filterButton} onPress={openFilter} activeOpacity={0.7}>
            <Filter size={width <= 375 ? 16 : 18} color="rgba(234,234,234,0.7)" />
            <Text style={styles.filterButtonText}>Szűrők</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                console.log('[Home] retry pressed');
                loadVenues().catch((e) => console.error('[Home] retry crashed', e));
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
                <Text style={styles.emptyStateSubtext}>Próbálj meg más szűrőket vagy keresési kifejezést</Text>
              </View>
            )}
          </>
        )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const pillRadius = 9999 as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: "#000000",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  brandLogo: {
    width: undefined as unknown as number,
    aspectRatio: 3.5,
    resizeMode: "contain",
    marginLeft: -14,
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
    paddingTop: 0,
    paddingBottom: 6,
    borderBottomWidth: 0,
    backgroundColor: Colors.background,
  },
  filtersContent: {
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterPill: {
    height: 28,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: pillRadius,
    backgroundColor: "#1A1F24",
    borderWidth: 0,
  },
  filterPillActive: {
    backgroundColor: "#24303A",
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EAEAEA",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    paddingHorizontal: 12,
    borderRadius: pillRadius,
    backgroundColor: "#1A1F24",
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EAEAEA",
  },
  venuesList: {
    flex: 1,
  },
  venuesContent: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  mapHeader: {
    width: "100%",
    marginBottom: 12,
    backgroundColor: "#0B0F14",
    overflow: "hidden",
  },
  mapHeaderTopRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 8,
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
