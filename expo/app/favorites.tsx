import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Heart, MapPin } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function FavoritesScreen() {
  const router = useRouter();

  const favorites = [
    {
      id: 1,
      name: "Café Memories",
      image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
      category: "Café",
      description: "Tasty and cool / Ízeletes és va...",
      distance: "0,3 km",
      status: "Zárva",
    },
    {
      id: 2,
      name: "Essence Delicates",
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
      category: "Bistro",
      description: "Fine Dining / Ízeletes és va...",
      distance: "0,5 km",
      status: "Nyitva",
    },
    {
      id: 8,
      name: "Warmup Bar",
      image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80",
      category: "Pub",
      description: "Student-friendly / Fiatalos és...",
      distance: "0,9 km",
      status: "Nyitva",
    },
    {
      id: 4,
      name: "Doblo Wine Bar",
      image: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      category: "Wine Bar",
      description: "Cozy wine bar in the Jewish Quarter...",
      distance: "0,4 km",
      status: "Zárva",
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Kedvencek", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Heart size={64} color="#00D1FF" fill="#00D1FF" />
          </View>
          <Text style={styles.headerTitle}>Kedvenc helyeim</Text>
          <Text style={styles.headerDescription}>
            {favorites.length} mentett helyszín
          </Text>
        </View>

        <View style={styles.section}>
          {favorites.map((venue) => (
            <TouchableOpacity 
              key={venue.id}
              style={styles.venueCard}
              onPress={() => router.push(`/venue/${venue.id}`)}
            >
              <Image 
                source={{ uri: venue.image }}
                style={styles.venueImage}
              />
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{venue.status}</Text>
              </View>
              <TouchableOpacity style={styles.favoriteButton}>
                <Heart size={20} color="#00D1FF" fill="#00D1FF" />
              </TouchableOpacity>
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueCategory}>{venue.category}</Text>
                <Text style={styles.venueDescription}>{venue.description}</Text>
                <View style={styles.venueFooter}>
                  <View style={styles.distanceContainer}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={styles.venueDistance}>{venue.distance}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  venueCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
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
    borderRadius: 4,
  },
  statusText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
  },
  venueDistance: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
