import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, type GestureResponderEvent } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Heart, MapPin } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useFavorites } from "@/context/FavoritesContext";

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
          <View style={styles.iconContainer}>
            <Heart size={64} color="#00D1FF" fill="#00D1FF" />
          </View>
          <Text style={styles.headerTitle}>Kedvenc helyeim</Text>
          <Text style={styles.headerDescription}>
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
              <Heart size={36} color="#00D1FF" />
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
                    <Heart size={20} color="#00D1FF" fill="#00D1FF" />
                  </TouchableOpacity>
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
                    <Text style={styles.venueCategory} numberOfLines={1}>{category}</Text>
                    <Text style={styles.venueDescription} numberOfLines={2}>{venue.description ?? "Mentett vendéglátóhely"}</Text>
                    <View style={styles.venueFooter}>
                      <View style={styles.distanceContainer}>
                        <MapPin size={14} color={Colors.textSecondary} />
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
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  syncErrorText: {
    marginTop: 10,
    color: "#F6B17A",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 20,
  },
  venueCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  venueImage: {
    width: "100%",
    height: 180,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.34)",
  },
  statusText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  venueInfo: {
    padding: 16,
  },
  venueName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  venueCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00D1FF",
    marginBottom: 6,
  },
  venueDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyStateCard: {
    minHeight: 280,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.22)",
    backgroundColor: "rgba(0, 209, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    gap: 10,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  exploreButton: {
    marginTop: 10,
    backgroundColor: "#00D1FF",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  exploreButtonText: {
    color: "#001219",
    fontSize: 14,
    fontWeight: "800",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: "#00D1FF",
    fontSize: 14,
    fontWeight: "700",
  },
});
