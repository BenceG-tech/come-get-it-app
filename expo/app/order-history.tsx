import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Clock, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

const CYAN = "#00C8E8" as const;

export default function OrderHistoryScreen() {
  const router = useRouter();

  const orders = [
    {
      id: 1,
      venueName: "Café Memories",
      venueImage: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
      date: "2024. Dec 28.",
      time: "18:30",
      items: ["1x Latte", "1x Croissant"],
      total: "2,500 Ft",
      status: "completed",
    },
    {
      id: 2,
      venueName: "Essence Delicates",
      venueImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80",
      date: "2024. Dec 22.",
      time: "20:00",
      items: ["1x Steak", "1x Red Wine"],
      total: "8,900 Ft",
      status: "completed",
    },
    {
      id: 3,
      venueName: "Warmup Bar",
      venueImage: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80",
      date: "2024. Dec 15.",
      time: "21:45",
      items: ["2x Beer", "1x Nachos"],
      total: "3,200 Ft",
      status: "completed",
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Rendelési előzmények", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>48</Text>
              <Text style={styles.statLabel}>Rendelés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>156,800</Text>
              <Text style={styles.statLabel}>Összes Ft</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Korábbi rendelések</Text>
          
          {orders.map((order) => (
            <TouchableOpacity 
              key={order.id}
              style={styles.orderItem}
              onPress={() => router.push(`/venue/${order.id}`)}
            >
              <Image 
                source={{ uri: order.venueImage }}
                style={styles.orderImage}
              />
              <View style={styles.orderInfo}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderName}>{order.venueName}</Text>
                  {order.status === "completed" && (
                    <View style={styles.statusBadge}>
                      <CheckCircle size={12} color={CYAN} />
                      <Text style={styles.statusText}>Teljesítve</Text>
                    </View>
                  )}
                </View>
                <View style={styles.orderDetails}>
                  <Clock size={12} color="rgba(255,255,255,0.44)" />
                  <Text style={styles.orderDate}>{order.date} · {order.time}</Text>
                </View>
                <View style={styles.orderItems}>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>· {item}</Text>
                  ))}
                </View>
                <Text style={styles.orderTotal}>Összesen: {order.total}</Text>
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
    paddingTop: 12,
    paddingBottom: 14,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: CYAN,
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignSelf: "center",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 11,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  orderImage: {
    width: 66,
    height: 66,
    borderRadius: 14,
    marginRight: 11,
  },
  orderInfo: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  orderName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: CYAN,
    fontWeight: "600",
  },
  orderDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
  },
  orderItems: {
    marginBottom: 6,
  },
  itemText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
    marginBottom: 1,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
});
