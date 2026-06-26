import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Plus, Gift, Clock, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

export default function CreditsTokensScreen() {
  const router = useRouter();

  const transactions = [
    { id: 1, type: "earned", amount: 50, description: "Látogatás - Café Memories", date: "2024. Dec 28.", icon: CheckCircle },
    { id: 2, type: "spent", amount: -30, description: "Jutalom beváltva", date: "2024. Dec 25.", icon: Gift },
    { id: 3, type: "earned", amount: 75, description: "Látogatás - Essence Delicates", date: "2024. Dec 22.", icon: CheckCircle },
    { id: 4, type: "earned", amount: 100, description: "Barát meghívása", date: "2024. Dec 20.", icon: Gift },
    { id: 5, type: "spent", amount: -50, description: "Jutalom beváltva", date: "2024. Dec 18.", icon: Gift },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Kreditek és Tokenek", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text, headerShadowVisible: false }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient
            colors={["rgba(6, 35, 47, 0.88)", "rgba(10, 56, 68, 0.76)"]}
            start={{ x: 0.12, y: 0.06 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Elérhető egyenleg</Text>
              <View style={styles.balancePill}>
                <Clock size={13} color="rgba(0, 200, 232, 0.92)" />
                <Text style={styles.balancePillText}>1 év</Text>
              </View>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>850</Text>
              <Text style={styles.balanceUnit}>pont</Text>
            </View>
            <Text style={styles.balanceSubtext}>Elegendő 8 jutalom beváltásához</Text>
          </LinearGradient>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} testID="buy-credits" activeOpacity={0.9}>
              <View style={styles.quickActionIcon}>
                <Plus size={18} color="rgba(0, 200, 232, 0.92)" />
              </View>
              <View style={styles.quickActionTextBlock}>
                <Text style={styles.quickActionTitle}>Kreditek vásárlása</Text>
                <Text style={styles.quickActionSubtitle}>Töltsd fel az egyenleged</Text>
              </View>
              <ArrowUpRight size={16} color="rgba(255,255,255,0.40)" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/rewards')} testID="browse-rewards" activeOpacity={0.9}>
              <View style={styles.quickActionIcon}>
                <Gift size={18} color="rgba(0, 200, 232, 0.92)" />
              </View>
              <View style={styles.quickActionTextBlock}>
                <Text style={styles.quickActionTitle}>Jutalmak böngészése</Text>
                <Text style={styles.quickActionSubtitle}>Költsd el a pontjaid</Text>
              </View>
              <ArrowDownRight size={16} color="rgba(255,255,255,0.40)" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tranzakciós előzmények</Text>
          
          {transactions.map((transaction) => {
            const Icon = transaction.icon;
            return (
              <View key={transaction.id} style={styles.transactionItem} testID={`transaction-${transaction.id}`}>
                <View
                  style={[
                    styles.transactionIcon,
                    transaction.type === "earned" ? styles.earnedIcon : styles.spentIcon,
                  ]}
                >
                  <Icon size={16} color={transaction.type === "earned" ? "rgba(0, 200, 232, 0.94)" : "rgba(255, 107, 107, 0.94)"} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === "earned" ? styles.earnedAmount : styles.spentAmount,
                  ]}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.infoBox} testID="points-expiration">
          <View style={styles.infoIcon}>
            <Clock size={16} color="rgba(0, 200, 232, 0.92)" />
          </View>
          <Text style={styles.infoText}>
            A pontjaid 1 évig érvényesek. A legrégebbi pontok 2025. Jan 15-én járnak le.
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
    paddingTop: 12,
    paddingBottom: 14,
  },
  balanceCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.14)",
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.62)",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  balancePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: "900",
    color: "#00C8E8",
    marginRight: 7,
    letterSpacing: -1,
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.66)",
  },
  balanceSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.68)",
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "column",
    gap: 8,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  quickActionTextBlock: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "800",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.46)",
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
    borderWidth: 1,
  },
  earnedIcon: {
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderColor: "rgba(0, 200, 232, 0.18)",
  },
  spentIcon: {
    backgroundColor: "rgba(255, 107, 107, 0.10)",
    borderColor: "rgba(255, 107, 107, 0.18)",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  earnedAmount: {
    color: "#00C8E8",
  },
  spentAmount: {
    color: "#FF6B6B",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginHorizontal: 16,
    marginBottom: 40,
    gap: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
});
