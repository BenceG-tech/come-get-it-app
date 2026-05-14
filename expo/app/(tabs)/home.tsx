import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Search, MapPin, Filter, Heart, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import VenueCard from "@/components/VenueCard";
import { Venue } from "@/types/venue";
import { rest } from "@/lib/supabaseRest";
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
  const logoHeight = width <= 375 ? 70 : 84;
  const headerHeight = insets.top + (width <= 375 ? 86 : 96);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        console.log("[Home] Fetching venues from Supabase...");
        const response = await rest("/venues?select=*");

        if (!response.ok) {
          console.error("[Home] Response not ok:", response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log("[Home] Raw response text:", responseText.substring(0, 200));

        let data: unknown;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("[Home] JSON parse error:", parseError);
          console.error("[Home] Response text that failed to parse:", responseText.substring(0, 500));
          throw new Error("Failed to parse response as JSON");
        }

        const rows = Array.isArray(data) ? (data as Venue[]) : [];
        console.log("[Home] Venues fetched:", rows.length);

        if (rows.length > 0) {
          const venuesWithImages = await Promise.all(
            rows.map(async (venue: Venue) => {
              try {
                if (venue.image_url || venue.hero_image_url) {
                  return venue;
                }

                const imagesResponse = await rest(
                  `/venue_images?venue_id=eq.${venue.id}&select=url,image_url,is_cover&order=is_cover.desc,created_at.asc&limit=1`
                );
                const imagesText = await imagesResponse.text();
                const images = JSON.parse(imagesText) as unknown;

                if (Array.isArray(images) && images.length > 0) {
                  const r = images[0] as { url?: string | null; image_url?: string | null };
                  const imageUrl = r?.url ?? r?.image_url ?? null;
                  if (typeof imageUrl === "string" && imageUrl.length > 0) {
                    return { ...venue, image_url: imageUrl };
                  }
                }

                return venue;
              } catch (imgError) {
                console.error(`[Home] Error fetching images for venue ${venue.id}:`, imgError);
                return venue;
              }
            })
          );

          setVenues(venuesWithImages);
        } else {
          console.log("[Home] No venues returned");
          setVenues([]);
        }
      } catch (error) {
        console.error("[Home] Error fetching venues:", error);
        setErrorMsg("Nem sikerült betölteni a helyszíneket. Ellenőrizd a kapcsolatot vagy próbáld újra.");
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const filteredVenues = venues.filter((venue) => {
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
      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
        <View style={[styles.headerCenter, { top: insets.top + 2, bottom: 2 }]}>
          <Image
            source={{ uri: logoUri }}
            accessibilityLabel="Come Get It logo"
            style={[styles.brandLogo, { height: logoHeight }]}
          />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity testID="home-search" onPress={openSearch} style={styles.headerButton} activeOpacity={0.7}>
            <Search size={iconSize} color="#EAEAEA" />
          </TouchableOpacity>
          <TouchableOpacity testID="home-map" onPress={openMap} style={styles.headerButton} activeOpacity={0.7}>
            <MapPin size={iconSize} color="#EAEAEA" />
          </TouchableOpacity>
        </View>
      </View>

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

      <ScrollView
        style={styles.venuesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.venuesContent}
      >
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
                setLoading(true);
                setErrorMsg(null);
                setVenues([]);
                (async () => {
                  try {
                    const response = await rest('/venues?select=*');
                    const json = (await response.json()) as unknown;
                    const rows = Array.isArray(json) ? (json as Venue[]) : [];
                    setVenues(rows);
                  } catch (e) {
                    console.error('[Home] retry failed', e);
                    setErrorMsg('Nem sikerült betölteni a helyszíneket.');
                  } finally {
                    setLoading(false);
                  }
                })().catch((e) => console.error('[Home] retry crashed', e));
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
      </ScrollView>
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
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    borderBottomWidth: 0,
    paddingHorizontal: 12,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  brandLogo: {
    width: undefined as unknown as number,
    aspectRatio: 3.5,
    resizeMode: "contain",
  },
  headerActions: {
    marginLeft: "auto",
    flexDirection: "row",
    gap: 8,
    paddingRight: 12,
    paddingTop: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersContainer: {
    paddingTop: 4,
    paddingBottom: 8,
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
    paddingTop: 12,
    paddingBottom: 100,
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
