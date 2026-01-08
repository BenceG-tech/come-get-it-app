import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Ticket, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useState } from "react";

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
          <View style={styles.iconContainer}>
            <Ticket size={64} color="#00D1FF" />
          </View>
          <Text style={styles.headerTitle}>Beváltható kuponkód</Text>
          <Text style={styles.headerDescription}>
            Add meg a kuponkódot és szerezz extra pontokat!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kuponkód megadása</Text>
          
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Írd be a kódot"
              placeholderTextColor={Colors.textSecondary}
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
              <CheckCircle size={20} color="#00D1FF" />
              <Text style={styles.successText}>Sikeresen beváltva! +{Math.floor(Math.random() * 100) + 50} pont</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktív kuponok</Text>
          
          {activeCoupons.map((coupon) => (
            <View key={coupon.id} style={styles.couponCard}>
              <View style={styles.couponIcon}>
                <Ticket size={24} color="#00D1FF" />
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
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Emailben vagy SMS-ben</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Közösségi média oldalainkon</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Partner helyszíneken</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
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
    lineHeight: 22,
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
  inputCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 4,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 1,
  },
  redeemButton: {
    backgroundColor: "#00D1FF",
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.background,
  },
  errorBox: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderRadius: 4,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#FF6B6B",
    textAlign: "center",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    borderRadius: 4,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    color: "#00D1FF",
    fontWeight: "600",
  },
  couponCard: {
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  couponIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  couponDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  couponExpiry: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  couponValue: {
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  couponValueText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00D1FF",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 4,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoBullet: {
    fontSize: 16,
    color: "#00D1FF",
    marginRight: 12,
    fontWeight: "700",
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
});
