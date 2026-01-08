import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { CreditCard, Plus, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function PaymentMethodsScreen() {
  const paymentMethods = [
    {
      id: 1,
      type: "visa",
      last4: "4242",
      expiry: "12/25",
      isDefault: true,
    },
    {
      id: 2,
      type: "mastercard",
      last4: "8888",
      expiry: "09/26",
      isDefault: false,
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Fizetési módok", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <CreditCard size={64} color="#00D1FF" />
          </View>
          <Text style={styles.headerTitle}>Fizetési módok</Text>
          <Text style={styles.headerDescription}>
            Kezeld a mentett bankkártyáidat
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton}>
            <View style={styles.addIcon}>
              <Plus size={24} color="#00D1FF" />
            </View>
            <Text style={styles.addButtonText}>Új kártya hozzáadása</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mentett kártyák</Text>
          
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.cardItem}>
              <View style={styles.cardIcon}>
                <CreditCard size={24} color="#00D1FF" />
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>
                    {method.type === "visa" ? "Visa" : "Mastercard"}
                  </Text>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Alapértelmezett</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardNumber}>•••• {method.last4}</Text>
                <Text style={styles.cardExpiry}>Lejár: {method.expiry}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton}>
                <Trash2 size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            A kártyaadataid biztonságban vannak. Titkosított kapcsolaton keresztül tároljuk őket.
          </Text>
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
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardType: {
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
  cardNumber: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  infoBox: {
    backgroundColor: "rgba(0, 209, 255, 0.1)",
    borderRadius: 4,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 18,
  },
});
