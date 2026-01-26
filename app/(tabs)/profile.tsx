import * as React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ChevronRight, UserPlus, History, CreditCard, User, MapPin, HelpCircle, Sparkles, Gift, Heart } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { points } = useAppContext();
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Szia Bence!</Text>
          <View style={styles.avatar} testID="profile-avatar">
            <User size={20} color={Colors.text} />
          </View>
        </View>

        {/* Come Get It Rewards Card */}
        <TouchableOpacity onPress={() => router.push('/rewards-missions')} activeOpacity={0.9} testID="open-rewards-card">
          <LinearGradient
            colors={["rgba(6, 35, 47, 0.92)", "rgba(11, 45, 59, 0.88)"]}
            start={{ x: 0.12, y: 0.06 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardsCard}
          >
            <View style={styles.rewardsHeader}>
              <View style={styles.rewardsTitleRow}>
                <View style={styles.rewardsBadge}>
                  <Gift size={14} color={"rgba(255,255,255,0.86)"} />
                  <Text style={styles.rewardsBadgeText}>Rewards</Text>
                </View>
                <Text style={styles.rewardsTitle}>Come Get It</Text>
              </View>
              <View style={styles.accentDot} />
            </View>

            <View style={styles.rewardsContent}>
              <View style={styles.pointsBlock}>
                <View style={styles.pointsLabelRow}>
                  <Sparkles size={14} color={"rgba(0, 209, 255, 0.95)"} />
                  <Text style={styles.pointsLabel}>Pontok</Text>
                </View>
                <Text style={styles.pointsValue} testID="profile-points">{points}</Text>
              </View>

              <View style={styles.rewardsCtaRow}>
                <View style={styles.rewardsCtaPill}>
                  <Text style={styles.rewardsCtaText}>Jutalmak megnyitása</Text>
                  <ChevronRight size={18} color={"rgba(0,0,0,0.9)"} />
                </View>
              </View>
            </View>

            <View style={styles.shineOverlay} pointerEvents="none" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/visit-history')}>
            <History size={22} color={Colors.text} />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Látogatási előzmények</Text>
              <Text style={styles.quickActionSubtitle}>200+ látogatás</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/credits-tokens')}>
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
            <TouchableOpacity>
              <Text style={styles.promoButtonText}>Elrejtés</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/invite-friends')}>
              <Text style={styles.promoButtonTextLarge}>Barátok meghívása</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Favorites Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kedvenceid</Text>
            <TouchableOpacity style={styles.viewAllButtonContainer} onPress={() => router.push('/favorites')}>
              <Text style={styles.viewAllButton}>Összes megtekintése</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favoritesScroll}>
            <TouchableOpacity onPress={() => router.push('/venue/1')} style={styles.favoriteCard}>
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
                  <Text style={styles.favoriteDistance}>0,3 km</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/venue/2')} style={styles.favoriteCard}>
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
                  <Text style={styles.favoriteDistance}>0,5 km</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/venue/8')} style={styles.favoriteCard}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80" }}
                style={styles.favoriteImage}
              />
              <View style={styles.favoriteLabel}>
                <Text style={styles.favoriteLabelText}>Nyitva</Text>
              </View>
              <View style={styles.favoriteContent}>
                <Text style={styles.favoriteName}>Warmup Bar</Text>
                <Text style={styles.favoriteDescription}>Pub - Student-friendly / Fiatalos és...</Text>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoriteDistance}>0,9 km</Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Quick Access Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gyors elérés</Text>
          
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/invite-friends')}>
              <UserPlus size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Barátok meghívása</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-impact')}>
              <Heart size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Hatásom</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/redeem-coupon')}>
              <Text style={[styles.menuIcon, { fontSize: 22 }]}>🎫</Text>
              <Text style={styles.menuTitle}>Kuponkód beváltása</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help')}>
              <HelpCircle size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Segítség</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/order-history')}>
              <History size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Rendelési előzmények</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Visits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Látogasd meg újra</Text>
          
          <TouchableOpacity onPress={() => router.push('/venue/4')} style={styles.recentOrderItem}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80" }}
              style={styles.recentOrderImage}
            />
            <View style={styles.recentOrderLabel}>
              <Text style={styles.recentOrderLabelText}>Zárva</Text>
            </View>
            <View style={styles.recentOrderInfo}>
              <Text style={styles.recentOrderName}>Doblo Wine Bar</Text>
              <Text style={styles.recentOrderDescription}>Cozy wine bar in the Jewish Quarter offering an extensive selection of Hungarian wines and charcuterie plates.</Text>
              <View style={styles.recentOrderDetails}>
                <Text style={styles.recentOrderDistance}>0,4 km</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/venue/5')} style={styles.recentOrderItem}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1769&q=80" }}
              style={styles.recentOrderImage}
            />
            <View style={styles.recentOrderLabel}>
              <Text style={styles.recentOrderLabelText}>Nyitva</Text>
            </View>
            <View style={styles.recentOrderInfo}>
              <Text style={styles.recentOrderName}>Boutiq Bar</Text>
              <Text style={styles.recentOrderDescription}>Award-winning cocktail bar known for innovative mixology and a sophisticated atmosphere.</Text>
              <View style={styles.recentOrderDetails}>
                <Text style={styles.recentOrderDistance}>0,6 km</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/venue/6')} style={styles.recentOrderItem}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1555658636-6e4a36218be7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80" }}
              style={styles.recentOrderImage}
            />
            <View style={styles.recentOrderLabel}>
              <Text style={styles.recentOrderLabelText}>Nyitva</Text>
            </View>
            <View style={styles.recentOrderInfo}>
              <Text style={styles.recentOrderName}>Élesztő Craft Beer Garden</Text>
              <Text style={styles.recentOrderDescription}>Spacious beer garden housed in a former glassworks factory, featuring over 20 Hungarian craft beers on tap.</Text>
              <View style={styles.recentOrderDetails}>
                <Text style={styles.recentOrderDistance}>1,2 km</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beállítások</Text>
          
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/account')}>
              <User size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Fiók</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/credits-tokens')}>
              <CreditCard size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Kreditek és Tokenek</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/payment-methods')}>
              <Text style={[styles.menuIcon, { fontSize: 22 }]}>💳</Text>
              <Text style={styles.menuTitle}>Fizetési módok</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/addresses')}>
              <MapPin size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Címeim</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  rewardsCard: {
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    position: "relative",
    overflow: "hidden",
    minHeight: 164,
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.18)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 10,
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  rewardsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rewardsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  rewardsBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.84)",
    letterSpacing: 0.2,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 0.2,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 209, 255, 0.95)",
    shadowColor: "#00D1FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },

  rewardsContent: {
    flexDirection: "column",
    gap: 14,
  },
  pointsBlock: {
    flexDirection: "column",
    gap: 6,
  },
  pointsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.68)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  pointsValue: {
    fontSize: 44,
    fontWeight: "900",
    color: "#00D1FF",
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  rewardsCtaRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  rewardsCtaPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(0, 209, 255, 0.92)",
  },
  rewardsCtaText: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(0,0,0,0.92)",
    letterSpacing: 0.2,
  },
  shineOverlay: {
    position: "absolute",
    top: -60,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.06)",
    transform: [{ rotate: "20deg" }],
  },

  quickActions: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#00D1FF",
    backgroundColor: "transparent",
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
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 4,
    padding: 16,
    shadowColor: "#00D1FF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  promoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 40,
    fontWeight: "400",
    paddingRight: 20,
  },
  promoButtons: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 16,
  },
  promoButtonText: {
    color: "#00D1FF",
    fontWeight: "500",
    fontSize: 12,
  },
  promoButtonTextLarge: {
    color: "#00D1FF",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 12,
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
  viewAllButtonContainer: {
    backgroundColor: "#02384D",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewAllButton: {
    fontSize: 16,
    color: "#00D1FF",
    fontWeight: "600",
  },
  favoritesScroll: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
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

  favoriteDistance: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  menuContainer: {
    backgroundColor: "transparent",
    borderRadius: 4,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: "#00D1FF",
    backgroundColor: "transparent",
  },
  menuIcon: {
    width: 22,
    textAlign: "center",
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
    alignItems: "flex-start",
    backgroundColor: "transparent",
    borderRadius: 4,
    padding: 0,
    paddingBottom: 16,
    marginBottom: 16,
    position: "relative",
  },
  recentOrderImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 16,
  },
  recentOrderLabel: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  recentOrderLabelText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  recentOrderInfo: {
    flex: 1,
    paddingTop: 4,
  },
  recentOrderName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  recentOrderDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  recentOrderDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },


  recentOrderDistance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  textureOverlay1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    opacity: 0.4,
  },
  textureOverlay2: {
    position: "absolute",
    top: "20%",
    left: "10%",
    right: "10%",
    bottom: "20%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    opacity: 0.6,
    borderRadius: 8,
  },
  gradientTexture1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 209, 255, 0.15)",
    opacity: 0.5,
  },
  gradientTexture2: {
    position: "absolute",
    top: "30%",
    left: "20%",
    right: "20%",
    bottom: "30%",
    backgroundColor: "rgba(0, 153, 204, 0.2)",
    opacity: 0.3,
    borderRadius: 12,
  },

});