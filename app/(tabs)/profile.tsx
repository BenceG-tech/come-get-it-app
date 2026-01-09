import * as React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ChevronRight, UserPlus, History, CreditCard, User, MapPin, HelpCircle, Shield } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { rest } from "@/lib/supabaseRest";

type SupabaseVenue = { id: string | number; name: string; address?: string | null };
function SupabaseTestList() {
  const [venues, setVenues] = React.useState<SupabaseVenue[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    console.info("[SupabaseMobile] Loading test venues...");
    setLoading(true);
    setError(null);
    setVenues([]);
    try {
      const res = await rest('/venues?select=id,name,address&order=created_at.desc&limit=5');
      const data = (await res.json()) as SupabaseVenue[];
      console.info("[SupabaseMobile] Received", Array.isArray(data) ? data.length : 0);
      setVenues(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("[SupabaseMobile] Fetch failed", e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.supabaseSection} testID="supabase-test">
      <Text style={styles.sectionTitle}>Supabase Venues (test)</Text>
      {loading ? <Text style={styles.hintText}>Loading...</Text> : null}
      {error ? (
        <Text style={styles.errorText} testID="error-text">{error}</Text>
      ) : null}

      <View style={styles.venueList}>
        {venues.map((v) => (
          <View key={String(v.id)} style={styles.venueItem} testID={`venue-${String(v.id)}`}>
            <Text style={styles.venueName}>{v.name ?? "-"}</Text>
            <Text style={styles.venueAddress}>{v.address ?? ""}</Text>
          </View>
        ))}
        {!loading && venues.length === 0 && !error ? (
          <Text style={styles.hintText} testID="hint-text">No venues yet</Text>
        ) : null}
      </View>
    </View>
  );
}

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}></Text>
          </View>
        </View>

        {/* Come Get It Rewards Card */}
        <TouchableOpacity onPress={() => router.push('/rewards-missions')} activeOpacity={0.9}>
          <LinearGradient
            colors={['#00D1FF', '#0099CC', '#007EA7', '#005577']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardsCard}
          >
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsTitle}>Come Get It Rewards</Text>
          </View>
          <View style={styles.rewardsContent}>
            <View style={styles.pointsSection}>
              <View style={styles.starsContainer}>
                <Image 
                  source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zxmev2vsyg0jyghz6tlxp" }}
                  style={styles.starImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.pointsValue}>{points}</Text>
            </View>
            <Text style={styles.rewardsSubtitle}>Koppints és nézd meg a jutalmakat →</Text>
          </View>
          <View style={styles.mascotContainer}>
            <Text style={styles.mascot}>🍺</Text>
          </View>
          {/* Multiple texture overlays for more gradient effect */}
          <View style={styles.textureOverlay1} />
          <View style={styles.textureOverlay2} />
          <View style={styles.gradientTexture1} />
          <View style={styles.gradientTexture2} />
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
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/admin')}
            >
              <Shield size={22} color={Colors.text} />
              <Text style={styles.menuTitle}>Admin - Venue Tags</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <SupabaseTestList />
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
    marginHorizontal: 12,
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

  rewardsContent: {
    flexDirection: "column",
  },
  pointsSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  starImage: {
    width: 60,
    height: 60,
  },
  pointsValue: {
    fontSize: 38,
    fontWeight: "900",
    color: Colors.background,
    lineHeight: 42,
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

  supabaseSection: {
    marginTop: 8,
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  inputRow: {
    marginBottom: 0,
  },
  input: {
    display: 'none',
  },
  loadBtn: {
    display: 'none',
  },
  loadBtnText: {
    display: 'none',
  },
  errorText: {
    color: Colors.error,
    marginBottom: 8,
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  venueList: {
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: Colors.primary,
  },
  venueItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.primary,
  },
  venueName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  venueAddress: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});