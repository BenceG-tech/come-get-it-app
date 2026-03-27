import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Clock, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

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
                      <CheckCircle size={14} color="#00D1FF" />
                      <Text style={styles.statusText}>Teljesítve</Text>
                    </View>
                  )}
                </View>
                <View style={styles.orderDetails}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.orderDate}>{order.date} • {order.time}</Text>
                </View>
                <View style={styles.orderItems}>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>• {item}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 20,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00D1FF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  orderName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: "#00D1FF",
    fontWeight: "600",
  },
  orderDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderItems: {
    marginBottom: 8,
  },
  itemText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
});
