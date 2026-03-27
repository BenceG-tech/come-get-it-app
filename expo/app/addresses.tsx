import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";

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
          <View style={styles.iconContainer}>
            <MapPin size={64} color="#00D1FF" />
          </View>
          <Text style={styles.headerTitle}>Mentett címek</Text>
          <Text style={styles.headerDescription}>
            Kezeld a kézbesítési címeidet
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton}>
            <View style={styles.addIcon}>
              <Plus size={24} color="#00D1FF" />
            </View>
            <Text style={styles.addButtonText}>Új cím hozzáadása</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Címek</Text>
          
          {addresses.map((addr) => (
            <View key={addr.id} style={styles.addressItem}>
              <View style={styles.addressIcon}>
                <MapPin size={24} color="#00D1FF" />
              </View>
              <View style={styles.addressInfo}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Alapértelmezett</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{addr.address}</Text>
                <Text style={styles.addressText}>{addr.city}, {addr.zipCode}</Text>
              </View>
              <View style={styles.addressActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Edit2 size={18} color="#00D1FF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Trash2 size={18} color="#FF6B6B" />
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
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 209, 255, 0.3)",
    borderStyle: "dashed",
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00D1FF",
  },
  addressItem: {
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
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
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 11,
    color: "#00D1FF",
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});
