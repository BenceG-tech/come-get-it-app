import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, Stack } from "expo-router";
import { Plus, Gift, Clock, CheckCircle } from "lucide-react-native";
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
      <Stack.Screen options={{ title: "Kreditek és Tokenek", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#00D1FF', '#0099CC', '#007EA7', '#005577']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Elérhető egyenleg</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>850</Text>
              <Text style={styles.balanceUnit}>pont</Text>
            </View>
            <Text style={styles.balanceSubtext}>Elegendő 8 jutalom beváltásához</Text>
          </LinearGradient>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={styles.quickActionIcon}>
                <Plus size={24} color="#00D1FF" />
              </View>
              <Text style={styles.quickActionText}>Kreditek vásárlása</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)')}>
              <View style={styles.quickActionIcon}>
                <Gift size={24} color="#00D1FF" />
              </View>
              <Text style={styles.quickActionText}>Jutalmak böngészése</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tranzakciós előzmények</Text>
          
          {transactions.map((transaction) => {
            const Icon = transaction.icon;
            return (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={[
                  styles.transactionIcon,
                  transaction.type === "earned" ? styles.earnedIcon : styles.spentIcon
                ]}>
                  <Icon size={20} color={transaction.type === "earned" ? "#00D1FF" : "#FF6B6B"} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === "earned" ? styles.earnedAmount : styles.spentAmount
                ]}>
                  {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Clock size={20} color="#00D1FF" />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  balanceCard: {
    borderRadius: 4,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.background,
    marginRight: 8,
  },
  balanceUnit: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.background,
  },
  balanceSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  earnedIcon: {
    backgroundColor: "rgba(0, 209, 255, 0.2)",
  },
  spentIcon: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: "600",
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
    backgroundColor: "rgba(0, 209, 255, 0.1)",
    borderRadius: 4,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
});
