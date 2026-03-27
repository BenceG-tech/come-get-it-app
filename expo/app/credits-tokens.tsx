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
            colors={["rgba(6, 35, 47, 0.94)", "rgba(10, 56, 68, 0.86)"]}
            start={{ x: 0.12, y: 0.06 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>Elérhető egyenleg</Text>
              <View style={styles.balancePill}>
                <Clock size={14} color={"rgba(0, 209, 255, 0.95)"} />
                <Text style={styles.balancePillText}>1 év</Text>
              </View>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>850</Text>
              <Text style={styles.balanceUnit}>pont</Text>
            </View>
            <Text style={styles.balanceSubtext}>Elegendő 8 jutalom beváltásához</Text>

            <View style={styles.balanceGlow} pointerEvents="none" />
          </LinearGradient>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} testID="buy-credits" activeOpacity={0.9}>
              <View style={styles.quickActionIcon}>
                <Plus size={20} color={"rgba(0, 209, 255, 0.95)"} />
              </View>
              <View style={styles.quickActionTextBlock}>
                <Text style={styles.quickActionTitle}>Kreditek vásárlása</Text>
                <Text style={styles.quickActionSubtitle}>Töltsd fel az egyenleged</Text>
              </View>
              <ArrowUpRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/rewards')} testID="browse-rewards" activeOpacity={0.9}>
              <View style={styles.quickActionIcon}>
                <Gift size={20} color={"rgba(0, 209, 255, 0.95)"} />
              </View>
              <View style={styles.quickActionTextBlock}>
                <Text style={styles.quickActionTitle}>Jutalmak böngészése</Text>
                <Text style={styles.quickActionSubtitle}>Költsd el a pontjaid</Text>
              </View>
              <ArrowDownRight size={18} color={Colors.textSecondary} />
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
                  <Icon size={18} color={transaction.type === "earned" ? "rgba(0, 209, 255, 0.95)" : "rgba(255, 107, 107, 0.95)"} />
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
            <Clock size={18} color={"rgba(0, 209, 255, 0.95)"} />
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
    paddingTop: 16,
    paddingBottom: 18,
  },
  balanceCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.16)",
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.68)",
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  balancePillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.82)",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 44,
    fontWeight: "900",
    color: "rgba(0, 209, 255, 0.98)",
    marginRight: 8,
    letterSpacing: -1.2,
  },
  balanceUnit: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255,255,255,0.72)",
  },
  balanceSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.74)",
    fontWeight: "600",
  },
  balanceGlow: {
    position: "absolute",
    top: -90,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 209, 255, 0.12)",
  },
  quickActions: {
    flexDirection: "column",
    gap: 10,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 209, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickActionTextBlock: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "800",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  earnedIcon: {
    backgroundColor: "rgba(0, 209, 255, 0.12)",
    borderColor: "rgba(0, 209, 255, 0.22)",
  },
  spentIcon: {
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    borderColor: "rgba(255, 107, 107, 0.22)",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  earnedAmount: {
    color: "#00D1FF",
  },
  spentAmount: {
    color: "#FF6B6B",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 40,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 209, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
});
