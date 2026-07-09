import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronRight,
  Coins,
  CreditCard,
  Crown,
  Gift,
  Heart,
  HelpCircle,
  History,
  LogOut,
  Martini,
  MapPin,
  Sparkles,
  Ticket,
  User,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

const CYAN = "#00C8E8" as const;
const SERIF = Platform.select({ ios: "Georgia", default: "serif" }) as string;

const NEXT_REWARD_TARGET = 5000;

type MenuGridItem = {
  title: string;
  subtitle: string;
  route: Href;
  icon: LucideIcon;
};

const menuGrid: MenuGridItem[] = [
  {
    title: "Kreditek és tokenek",
    subtitle: "Egyenleg és beváltások",
    route: "/credits-tokens",
    icon: Wallet,
  },
  {
    title: "Barátok meghívása",
    subtitle: "+500 pont barátonként",
    route: "/invite-friends",
    icon: UserPlus,
  },
  {
    title: "Fizetési módok",
    subtitle: "Kártyák kezelése",
    route: "/payment-methods",
    icon: CreditCard,
  },
  {
    title: "Látogatási előzmények",
    subtitle: "Korábbi helyek",
    route: "/visit-history",
    icon: History,
  },
  {
    title: "Hatásom",
    subtitle: "Közösségi eredményeid",
    route: "/my-impact",
    icon: Heart,
  },
  {
    title: "Kuponkód",
    subtitle: "Partner ajánlat aktiválása",
    route: "/redeem-coupon",
    icon: Ticket,
  },
  {
    title: "Fiók",
    subtitle: "Profiladatok és belépés",
    route: "/account",
    icon: User,
  },
  {
    title: "Segítség",
    subtitle: "Gyors válaszok",
    route: "/help",
    icon: HelpCircle,
  },
];

type ActivityItem = {
  id: string;
  title: string;
  place: string;
  when: string;
  delta: number;
  icon: LucideIcon;
};

const recentActivity: ActivityItem[] = [
  { id: "a1", title: "Pontszerzés", place: "Blue Fox Bar", when: "Ma, 21:14", delta: 240, icon: Sparkles },
  { id: "a2", title: "Ital beváltva", place: "Vinozza Budapest", when: "Tegnap, 19:02", delta: -800, icon: Martini },
  { id: "a3", title: "Pontszerzés", place: "Ruin Garden", when: "Kedd, 22:41", delta: 180, icon: Sparkles },
  { id: "a4", title: "Meghívás jóváírás", place: "Barát csatlakozott", when: "Múlt héten", delta: 500, icon: UserPlus },
];

type StatChip = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { points } = useAppContext();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const { favoriteVenues } = useFavorites();

  const handleSignOut = useCallback(() => {
    Alert.alert("Kijelentkezés", "Biztosan kijelentkezel?", [
      { text: "Mégsem", style: "cancel" },
      {
        text: "Kijelentkezés",
        style: "destructive",
        onPress: async () => {
          try {
            setSigningOut(true);
            await signOut();
            router.replace("/auth");
          } catch (e) {
            console.error("[Profile] Sign out failed", e);
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  }, [router, signOut]);

  const progress = useMemo<number>(() => {
    const raw = points / NEXT_REWARD_TARGET;
    return Math.max(0.04, Math.min(1, raw));
  }, [points]);

  const missing = Math.max(0, NEXT_REWARD_TARGET - points);

  const stats: StatChip[] = [
    { label: "Látogatás", value: "200+", icon: MapPin },
    { label: "Kedvenc", value: String(favoriteVenues.length), icon: Heart },
    { label: "Token", value: "12", icon: Coins },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCompact}>
          <View style={styles.headerNameRow}>
            <Text style={styles.profileName}>Bence</Text>
            <View style={styles.tierBadge}>
              <Crown size={11} color="#0A1114" />
              <Text style={styles.tierBadgeText}>Platina</Text>
            </View>
          </View>
          <Text style={styles.memberSince}>Come Get It tag · 2024. január óta</Text>
        </View>

        <View style={styles.balanceCard} testID="balance-card">
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>EGYENLEG</Text>
              <View style={styles.balancePointsRow}>
                <Text style={styles.balancePoints} testID="profile-points">{points.toLocaleString("hu-HU")}</Text>
                <Text style={styles.balanceUnit}>pont</Text>
              </View>
            </View>
            <View style={styles.balanceGiftWrap}>
              <Gift size={20} color={CYAN} strokeWidth={1.9} />
            </View>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressLabelsRow}>
              <Text style={styles.progressLabel}>Következő jutalom</Text>
              <Text style={styles.progressValue}>
                {missing > 0 ? `még ${missing.toLocaleString("hu-HU")} pont` : "beváltható!"}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={["#00E0FF", "#0090B8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]}
              />
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/rewards-missions")} testID="open-rewards-card">
            <LinearGradient
              colors={["#00E0FF", "#0090B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.balanceCta}
            >
              <Text style={styles.balanceCtaText}>Küldetések és jutalmak</Text>
              <ChevronRight size={17} color="#001014" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat: StatChip) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={styles.statChip}>
                <View style={styles.statIconWrap}>
                  <Icon size={14} color={CYAN} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legutóbbi aktivitás</Text>
          <View style={styles.timelineCard}>
            {recentActivity.map((item: ActivityItem, index: number) => {
              const Icon = item.icon;
              const isLast = index === recentActivity.length - 1;
              const positive = item.delta > 0;
              return (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, positive ? styles.timelineDotEarn : styles.timelineDotSpend]}>
                      <Icon size={11} color={positive ? CYAN : "#F6B17A"} />
                    </View>
                    {!isLast ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={[styles.timelineBody, !isLast && styles.timelineBodyBorder]}>
                    <View style={styles.timelineTextBlock}>
                      <Text style={styles.timelineTitle}>{item.title}</Text>
                      <Text style={styles.timelineMeta}>{item.place} · {item.when}</Text>
                    </View>
                    <Text style={[styles.timelineDelta, positive ? styles.deltaEarn : styles.deltaSpend]}>
                      {positive ? "+" : ""}{item.delta.toLocaleString("hu-HU")} p
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menü</Text>
          <View style={styles.menuGrid}>
            {menuGrid.map((item: MenuGridItem) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.title}
                  style={styles.menuCard}
                  onPress={() => router.push(item.route)}
                  activeOpacity={0.84}
                  testID={`menu-${item.title}`}
                >
                  <View style={styles.menuIconWrap}>
                    <Icon size={17} color={CYAN} />
                  </View>
                  <Text style={styles.menuTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.menuSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.82}
          testID="sign-out-button"
          accessibilityRole="button"
          accessibilityLabel="Kijelentkezés"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <LogOut size={17} color="#FF6B6B" />
          )}
          <Text style={styles.signOutText}>Kijelentkezés</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerCompact: {
    paddingTop: 62,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  profileName: {
    color: Colors.text,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "700",
    fontFamily: SERIF,
    letterSpacing: -0.3,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: CYAN,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    shadowColor: CYAN,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  tierBadgeText: {
    color: "#0A1114",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  memberSince: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
    fontWeight: "600",
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(8, 22, 28, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.24)",
    shadowColor: CYAN,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  balancePointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
  },
  balancePoints: {
    color: CYAN,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  balanceUnit: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 14,
    fontWeight: "800",
  },
  balanceGiftWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 200, 232, 0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBlock: {
    marginBottom: 14,
  },
  progressLabelsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  progressLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 12,
    fontWeight: "700",
  },
  progressValue: {
    color: CYAN,
    fontSize: 12,
    fontWeight: "900",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  balanceCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 15,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  balanceCtaText: {
    color: "#001014",
    fontSize: 14,
    fontWeight: "900",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 9,
    marginBottom: 22,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  statValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    fontFamily: SERIF,
    letterSpacing: -0.2,
    paddingHorizontal: 16,
    marginBottom: 11,
  },
  timelineCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 9,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  timelineDotEarn: {
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderColor: "rgba(0, 200, 232, 0.28)",
  },
  timelineDotSpend: {
    backgroundColor: "rgba(246, 177, 122, 0.10)",
    borderColor: "rgba(246, 177, 122, 0.30)",
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: 2,
  },
  timelineBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 9,
  },
  timelineBodyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
    marginBottom: 9,
  },
  timelineTextBlock: {
    flex: 1,
  },
  timelineTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 1,
  },
  timelineMeta: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 11,
    lineHeight: 14,
  },
  timelineDelta: {
    fontSize: 12.5,
    fontWeight: "900",
  },
  deltaEarn: {
    color: CYAN,
  },
  deltaSpend: {
    color: "#F6B17A",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  menuCard: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 18,
    padding: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "rgba(0, 200, 232, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  menuTitle: {
    color: Colors.text,
    fontSize: 13.5,
    fontWeight: "900",
    marginBottom: 2,
  },
  menuSubtitle: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 11,
    lineHeight: 15,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255, 107, 107, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.28)",
  },
  signOutText: {
    color: "#FF6B6B",
    fontSize: 14.5,
    fontWeight: "800",
  },
});
