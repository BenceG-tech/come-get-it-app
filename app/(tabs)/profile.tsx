import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ChevronRight, UserPlus, History, CreditCard } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
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
        <LinearGradient
          colors={['#00D1FF', '#007EA7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rewardsCard}
        >
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
          {/* Texture overlay */}
          <View style={styles.textureOverlay} />
          {/* Gradient texture overlay */}
          <View style={styles.gradientTexture} />
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem}>
            <History size={22} color={Colors.text} />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Látogatási előzmények</Text>
              <Text style={styles.quickActionSubtitle}>200+ látogatás</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionItem}>
            <CreditCard size={22} color={Colors.text} />
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
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80" }}
                style={styles.favoriteImage}
              />
              <View style={styles.favoriteLabel}>
                <Text style={styles.favoriteLabelText}>Zárva</Text>
              </View>
              <View style={styles.favoriteContent}>
                <Text style={styles.favoriteName}>Café Memories</Text>
                <Text style={styles.favoriteDescription}>Café - Tasty and cool / Ízeletes és va...</Text>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoritePrice}>879 Ft</Text>
                  <Text style={styles.favoriteRating}>★ 9,2</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.favoriteCard}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80" }}
                style={styles.favoriteImage}
              />
              <View style={styles.favoriteLabel}>
                <Text style={styles.favoriteLabelText}>Nyitva</Text>
              </View>
              <View style={styles.favoriteContent}>
                <Text style={styles.favoriteName}>Essence Delicates</Text>
                <Text style={styles.favoriteDescription}>Bistro - Fine Dining / Ízeletes és va...</Text>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoritePrice}>1200 Ft</Text>
                  <Text style={styles.favoriteRating}>★ 9,5</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.favoriteCard}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" }}
                style={styles.favoriteImage}
              />
              <View style={styles.favoriteLabel}>
                <Text style={styles.favoriteLabelText}>Nyitva</Text>
              </View>
              <View style={styles.favoriteContent}>
                <Text style={styles.favoriteName}>Warmup Bar</Text>
                <Text style={styles.favoriteDescription}>Pub - Student-friendly / Fiatalos és...</Text>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoritePrice}>800 Ft</Text>
                  <Text style={styles.favoriteRating}>★ 8,9</Text>
                </View>
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
              <Text style={styles.recentOrderDescription}>Kézműves italok várják rendelésed!</Text>
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
    borderRadius: 4,
    backgroundColor: "#00D1FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.background,
  },
  rewardsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 4,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    minHeight: 170,
    shadowColor: "#00D1FF",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
    borderRadius: 4,
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
    borderRadius: 4,
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
    fontSize: 48,
    fontWeight: "900",
    color: Colors.background,
    lineHeight: 52,
    letterSpacing: -1,
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
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 4,
    overflow: "hidden",
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 16,
  },
  quickActionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  promoBanner: {
    backgroundColor: "#02384D",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 4,
    padding: 24,
    shadowColor: "#00D1FF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.text,
  },
  promoButtonSecondaryText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  promoButtonPrimary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
    backgroundColor: Colors.text,
  },
  promoButtonPrimaryText: {
    color: "#02384D",
    fontWeight: "700",
    fontSize: 16,
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
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  favoriteImage: {
    width: "100%",
    height: 120,
  },
  favoriteLabel: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  favoriteLabelText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  favoriteContent: {
    padding: 12,
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
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  menuTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 16,
  },
  recentOrderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 18,
  },
  recentOrderImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
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
  textureOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    opacity: 0.3,
  },
  gradientTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 209, 255, 0.1)",
    opacity: 0.4,
  },
});