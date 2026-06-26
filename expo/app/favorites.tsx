import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, type GestureResponderEvent } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Heart, MapPin } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useFavorites } from "@/context/FavoritesContext";

const CYAN = "#00C8E8" as const;

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteVenues, favoriteVenueIds, isLoading, syncError, toggleFavorite, refreshFavorites } = useFavorites();
  const fallbackImageUri = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900";

  const openVenue = (venueId: string) => {
    router.push(`/venue/${encodeURIComponent(String(venueId))}`);
  };

  const removeFavorite = async (event: GestureResponderEvent, venueId: string) => {
    event.stopPropagation();
    await toggleFavorite(String(venueId));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Kedvencek", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kedvenc helyeim</Text>
          <Text style={styles.headerSub}>
            {favoriteVenueIds.length} mentett helyszín
          </Text>
          {syncError ? <Text style={styles.syncErrorText}>{syncError}</Text> : null}
        </View>

        <View style={styles.section}>
          {isLoading ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>Kedvencek betöltése...</Text>
              <Text style={styles.emptyDescription}>Pár pillanat és megjelennek a mentett helyeid.</Text>
            </View>
          ) : favoriteVenues.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Heart size={30} color={CYAN} />
              <Text style={styles.emptyTitle}>Még nincs kedvenc helyed</Text>
              <Text style={styles.emptyDescription}>
                A vendéglátóhelyek listáján vagy a részletes oldalon nyomj a szív ikonra, és ide kerülnek a mentett helyeid.
              </Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.push("/(tabs)/home")} activeOpacity={0.85}>
                <Text style={styles.exploreButtonText}>Helyek böngészése</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryButton} onPress={() => refreshFavorites()} activeOpacity={0.85}>
                <Text style={styles.retryButtonText}>Frissítés</Text>
              </TouchableOpacity>
            </View>
          ) : (
            favoriteVenues.map((venue) => {
              const imageUri = venue.image_url ?? venue.hero_image_url ?? fallbackImageUri;
              const category = venue.tags?.[0] ?? "Vendéglátóhely";
              return (
                <TouchableOpacity 
                  key={venue.id}
                  style={styles.venueCard}
                  onPress={() => openVenue(String(venue.id))}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: imageUri }} style={styles.venueImage} />
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Kedvenc</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(event: GestureResponderEvent) => removeFavorite(event, String(venue.id))}
                    accessibilityRole="button"
                    accessibilityLabel={`${venue.name} eltávolítása a kedvencekből`}
                    activeOpacity={0.85}
                  >
                    <Heart size={18} color={CYAN} fill={CYAN} />
                  </TouchableOpacity>
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
                    <Text style={styles.venueCategory} numberOfLines={1}>{category}</Text>
                    <Text style={styles.venueDescription} numberOfLines={2}>{venue.description ?? "Mentett vendéglátóhely"}</Text>
                    <View style={styles.venueFooter}>
                      <View style={styles.distanceContainer}>
                        <MapPin size={12} color="rgba(255,255,255,0.44)" />
                        <Text style={styles.venueDistance}>{venue.distance ? `${(venue.distance / 1000).toFixed(1)} km` : venue.address ?? "Részletek"}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.48)",
  },
  syncErrorText: {
    marginTop: 8,
    color: "#F6B17A",
    fontSize: 12,
    lineHeight: 17,
  },
  section: {
    paddingHorizontal: 16,
  },
  venueCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  venueImage: {
    width: "100%",
    height: 164,
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.66)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.28)",
  },
  statusText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.66)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  venueInfo: {
    padding: 14,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  venueCategory: {
    fontSize: 13,
    fontWeight: "600",
    color: CYAN,
    marginBottom: 5,
  },
  venueDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.44)",
    lineHeight: 18,
    marginBottom: 10,
  },
  venueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  venueDistance: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
  },
  emptyStateCard: {
    minHeight: 240,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.16)",
    backgroundColor: "rgba(0, 200, 232, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  exploreButton: {
    marginTop: 8,
    backgroundColor: CYAN,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  exploreButtonText: {
    color: "#001219",
    fontSize: 13,
    fontWeight: "800",
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryButtonText: {
    color: CYAN,
    fontSize: 13,
    fontWeight: "700",
  },
});
