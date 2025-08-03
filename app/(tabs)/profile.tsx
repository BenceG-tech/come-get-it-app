import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ChevronRight, History, UserPlus, Gift, HelpCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";

export default function ProfileScreen() {
  const { points } = useAppContext();
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Szia Bence!</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>BG</Text>
          </View>
        </View>

        {/* Come Get It Rewards Card */}
        <View style={styles.rewardsCard}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsTitle}>Come Get It Rewards</Text>
            <View style={styles.betaLabel}>
              <Text style={styles.betaText}>BETA</Text>
            </View>
          </View>
          <View style={styles.rewardsContent}>
            <View style={styles.pointsSection}>
              <View style={styles.coinIcon}>
                <Text style={styles.coinText}>★</Text>
              </View>
              <Text style={styles.pointsValue}>{points}</Text>
            </View>
            <Text style={styles.rewardsSubtitle}>Koppints és nézd meg a jutalmakat →</Text>
          </View>
          <View style={styles.mascotContainer}>
            <Text style={styles.mascot}>🍺</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Látogatási előzmények</Text>
              <Text style={styles.quickActionSubtitle}>200+ látogatás</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Kreditek és tokenek</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Promotional Banner */}
        <View style={styles.promoBanner}>
          <Text style={styles.promoText}>
            Szeretnél kevesebbet fizetni a következő vendéglátóhelynél? Hívd meg egy barátodat, és az első látogatásánál bezsebelheted a Come Get It krediteket!
          </Text>
          <View style={styles.promoButtons}>
            <TouchableOpacity style={styles.promoButtonSecondary}>
              <Text style={styles.promoButtonSecondaryText}>Elrejtés</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.promoButtonPrimary}>
              <Text style={styles.promoButtonPrimaryText}>Barátok meghívása</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Favorites Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kedvenceid</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllButton}>Összes megtekintése</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favoritesScroll}>
            <View style={styles.favoriteCard}>
              <View style={styles.favoriteImageContainer}>
                <Text style={styles.favoriteLabel}>Zárva</Text>
              </View>
              <Text style={styles.favoriteName}>Café Memories</Text>
              <Text style={styles.favoriteDescription}>Café - Tasty and cool / Ízeletes és va...</Text>
              <View style={styles.favoriteInfo}>
                <Text style={styles.favoritePrice}>879 Ft</Text>
                <Text style={styles.favoriteRating}>★ 9,2</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Quick Access Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gyors elérés</Text>
          
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem}>
              <UserPlus size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Barátok meghívása</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Gift size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Kuponkód beváltása</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <HelpCircle size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Segítség</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <History size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Beváltási előzmények</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Újralátogatás</Text>
          
          <TouchableOpacity style={styles.recentOrderItem}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80" }}
              style={styles.recentOrderImage}
            />
            <View style={styles.recentOrderInfo}>
              <Text style={styles.recentOrderName}>Café Memories</Text>
              <Text style={styles.recentOrderDescription}>Kézműves hamburgerek várják rendelésed!</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00CFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.background,
  },
  rewardsCard: {
    backgroundColor: "#00CFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    minHeight: 160,
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.background,
    fontStyle: "italic",
  },
  betaLabel: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betaText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.background,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rewardsContent: {
    flexDirection: "column",
  },
  pointsSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  coinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  coinText: {
    fontSize: 16,
    color: Colors.background,
  },
  pointsValue: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.background,
    lineHeight: 48,
  },
  rewardsSubtitle: {
    fontSize: 15,
    color: Colors.background,
    opacity: 0.85,
    fontWeight: "500",
  },
  mascotContainer: {
    position: "absolute",
    right: 20,
    top: 20,
    bottom: 20,
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },
  mascot: {
    fontSize: 64,
  },
  quickActions: {
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  promoBanner: {
    backgroundColor: "#1A3A3D",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
  },
  promoText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: "400",
  },
  promoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  promoButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#00CFFF",
  },
  promoButtonSecondaryText: {
    color: "#00CFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  promoButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#00CFFF",
  },
  promoButtonPrimaryText: {
    color: Colors.background,
    fontWeight: "600",
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  viewAllButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
  },
  favoritesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  favoriteCard: {
    width: 200,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  favoriteImageContainer: {
    height: 120,
    backgroundColor: "#8B4513",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  favoriteLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  favoriteDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  favoriteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  favoritePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  favoriteRating: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  menuContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginLeft: 16,
  },
  recentOrderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
  },
  recentOrderImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 16,
  },
  recentOrderInfo: {
    flex: 1,
  },
  recentOrderName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  recentOrderDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});