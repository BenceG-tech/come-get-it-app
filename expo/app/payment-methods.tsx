import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { CreditCard, Plus, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";

const CYAN = "#00C8E8" as const;

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
          <Text style={styles.headerTitle}>Fizetési módok</Text>
          <Text style={styles.headerSub}>Kezeld a mentett bankkártyáidat</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton}>
            <View style={styles.addIcon}>
              <Plus size={20} color={CYAN} />
            </View>
            <Text style={styles.addButtonText}>Új kártya hozzáadása</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mentett kártyák</Text>
          
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.cardItem}>
              <View style={styles.cardIcon}>
                <CreditCard size={20} color={CYAN} />
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>
                    {method.type === "visa" ? "Visa" : "Mastercard"}
                  </Text>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Alapért.</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardNumber}>···· {method.last4}</Text>
                <Text style={styles.cardExpiry}>Lejár: {method.expiry}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton}>
                <Trash2 size={18} color="#FF6B6B" />
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
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardIcon: {
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
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  cardType: {
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
  cardNumber: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
  },
  deleteButton: {
    padding: 8,
  },
  infoBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
    textAlign: "center",
    lineHeight: 17,
  },
});
