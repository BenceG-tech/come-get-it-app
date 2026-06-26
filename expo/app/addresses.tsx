import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";

const CYAN = "#00C8E8" as const;

export default function AddressesScreen() {
  const addresses = [
    {
      id: 1,
      label: "Otthon",
      address: "Kossuth Lajos utca 12.",
      city: "Budapest",
      zipCode: "1053",
      isDefault: true,
    },
    {
      id: 2,
      label: "Munkahely",
      address: "Andrássy út 45.",
      city: "Budapest",
      zipCode: "1062",
      isDefault: false,
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Címeim", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mentett címek</Text>
          <Text style={styles.headerSub}>Kezeld a kézbesítési címeidet</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton}>
            <View style={styles.addIcon}>
              <Plus size={20} color={CYAN} />
            </View>
            <Text style={styles.addButtonText}>Új cím hozzáadása</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Címek</Text>
          
          {addresses.map((addr) => (
            <View key={addr.id} style={styles.addressItem}>
              <View style={styles.addressIcon}>
                <MapPin size={20} color={CYAN} />
              </View>
              <View style={styles.addressInfo}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Alapért.</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
                <Text style={styles.addressText}>{addr.city}, {addr.zipCode}</Text>
              </View>
              <View style={styles.addressActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Edit2 size={16} color={CYAN} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Trash2 size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </View>
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
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.22)",
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: CYAN,
  },
  addressItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    color: CYAN,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.44)",
    marginBottom: 1,
  },
  addressActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    padding: 8,
  },
});
