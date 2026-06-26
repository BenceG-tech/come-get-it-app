import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Ticket, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useState } from "react";

const CYAN = "#00C8E8" as const;

export default function RedeemCouponScreen() {
  const [couponCode, setCouponCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleRedeem = () => {
    setError("");
    setRedeemSuccess(false);
    
    if (!couponCode.trim()) {
      setError("Kérlek, add meg a kuponkódot");
      return;
    }

    setIsRedeeming(true);
    
    setTimeout(() => {
      setIsRedeeming(false);
      setRedeemSuccess(true);
      setCouponCode("");
      setTimeout(() => setRedeemSuccess(false), 3000);
    }, 1000);
  };

  const activeCoupons = [
    { id: 1, code: "WELCOME50", value: "50 pont", expiresAt: "2024. Dec 31.", description: "Üdvözlő kupon" },
    { id: 2, code: "NEWYEAR100", value: "100 pont", expiresAt: "2025. Jan 15.", description: "Újévi ajándék" },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Kuponkód beváltása", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Beváltható kuponkód</Text>
          <Text style={styles.headerSub}>
            Add meg a kuponkódot és szerezz extra pontokat!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kuponkód megadása</Text>
          
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Írd be a kódot"
              placeholderTextColor="rgba(255,255,255,0.40)"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={[styles.redeemButton, isRedeeming && styles.redeemButtonDisabled]}
              onPress={handleRedeem}
              disabled={isRedeeming}
            >
              <Text style={styles.redeemButtonText}>
                {isRedeeming ? "Beváltás..." : "Beváltás"}
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {redeemSuccess ? (
            <View style={styles.successBox}>
              <CheckCircle size={18} color={CYAN} />
              <Text style={styles.successText}>Sikeresen beváltva!</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktív kuponok</Text>
          
          {activeCoupons.map((coupon) => (
            <View key={coupon.id} style={styles.couponCard}>
              <View style={styles.couponIcon}>
                <Ticket size={20} color={CYAN} />
              </View>
              <View style={styles.couponInfo}>
                <Text style={styles.couponCode}>{coupon.code}</Text>
                <Text style={styles.couponDescription}>{coupon.description}</Text>
                <Text style={styles.couponExpiry}>Lejár: {coupon.expiresAt}</Text>
              </View>
              <View style={styles.couponValue}>
                <Text style={styles.couponValueText}>{coupon.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Hol találsz kuponokat?</Text>
          <View style={styles.infoItem}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Emailben vagy SMS-ben</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Közösségi média oldalainkon</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Partner helyszíneken</Text>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>Barátok meghívásával</Text>
          </View>
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
    lineHeight: 18,
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
  inputCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  redeemButton: {
    backgroundColor: CYAN,
    borderRadius: 25,
    padding: 14,
    alignItems: "center",
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#001014",
  },
  errorBox: {
    backgroundColor: "rgba(255, 107, 107, 0.10)",
    borderRadius: 14,
    padding: 11,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.18)",
  },
  errorText: {
    fontSize: 13,
    color: "#FF6B6B",
    textAlign: "center",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderRadius: 14,
    padding: 11,
    marginTop: 10,
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.16)",
  },
  successText: {
    fontSize: 13,
    color: CYAN,
    fontWeight: "600",
  },
  couponCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  couponIcon: {
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
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  couponDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
    marginBottom: 2,
  },
  couponExpiry: {
    fontSize: 11,
    color: "rgba(255,255,255,0.36)",
  },
  couponValue: {
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  couponValueText: {
    fontSize: 13,
    fontWeight: "700",
    color: CYAN,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: CYAN,
  },
  infoText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.46)",
    flex: 1,
  },
});
