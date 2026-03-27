import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Calendar, MapPin } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function VisitHistoryScreen() {
  const router = useRouter();

  const visits = [
    {
      id: 1,
      venueName: "Café Memories",
      venueImage: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
      date: "2024. Dec 28.",
      time: "18:30",
      distance: "0,3 km",
      points: 50,
    },
    {
      id: 2,
      venueName: "Essence Delicates",
      venueImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
      date: "2024. Dec 22.",
      time: "20:00",
      distance: "0,5 km",
      points: 75,
    },
    {
      id: 3,
      venueName: "Warmup Bar",
      venueImage: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80",
      date: "2024. Dec 15.",
      time: "21:45",
      distance: "0,9 km",
      points: 60,
    },
    {
      id: 4,
      venueName: "Doblo Wine Bar",
      venueImage: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
      date: "2024. Dec 10.",
      time: "19:15",
      distance: "0,4 km",
      points: 80,
    },
    {
      id: 5,
      venueName: "Boutiq Bar",
      venueImage: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80",
      date: "2024. Dec 5.",
      time: "22:00",
      distance: "0,6 km",
      points: 70,
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Látogatási előzmények", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text, headerShadowVisible: false }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.statsContainer} testID="visit-history-stats">
            <View style={styles.statBox}>
              <Text style={styles.statValue}>203</Text>
              <Text style={styles.statLabel}>Látogatás</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>Helyszín</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>8,450</Text>
              <Text style={styles.statLabel}>Pontok</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Korábbi látogatások</Text>
          
          {visits.map((visit) => (
            <TouchableOpacity 
              key={visit.id}
              style={styles.visitItem}
              onPress={() => router.push(`/venue/${visit.id}`)}
              activeOpacity={0.9}
              testID={`visit-history-item-${visit.id}`}
            >
              <Image 
                source={{ uri: visit.venueImage }}
                style={styles.visitImage}
              />
              <View style={styles.visitInfo}>
                <Text style={styles.visitName}>{visit.venueName}</Text>
                <View style={styles.visitDetails}>
                  <Calendar size={14} color={Colors.textSecondary} />
                  <Text style={styles.visitDate}>{visit.date} • {visit.time}</Text>
                </View>
                <View style={styles.visitDetails}>
                  <MapPin size={14} color={Colors.textSecondary} />
                  <Text style={styles.visitDistance}>{visit.distance}</Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{visit.points} pont</Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "rgba(0, 209, 255, 0.95)",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  visitItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  visitImage: {
    width: 78,
    height: 78,
    borderRadius: 14,
    marginRight: 12,
  },
  visitInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  visitName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  visitDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  visitDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  visitDistance: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 209, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.18)",
  },
  pointsText: {
    fontSize: 12,
    color: "rgba(0, 209, 255, 0.95)",
    fontWeight: "800",
  },
});
