import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronRight,
  CreditCard,
  Gift,
  Heart,
  HelpCircle,
  History,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { useFavorites } from "@/context/FavoritesContext";
import type { Venue } from "@/types/venue";

type ShortcutItem = {
  title: string;
  subtitle?: string;
  route: Href;
  icon: LucideIcon;
};

type ProfileStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const quickActions: ShortcutItem[] = [
  {
    title: "Látogatási előzmények",
    subtitle: "Korábbi helyek és aktivitás",
    route: "/visit-history",
    icon: History,
  },
  {
    title: "Kreditek és tokenek",
    subtitle: "Egyenleg, pontok és beváltások",
    route: "/credits-tokens",
    icon: CreditCard,
  },
];

const accountMenu: ShortcutItem[] = [
  {
    title: "Barátok meghívása",
    subtitle: "Szerezz extra pontokat",
    route: "/invite-friends",
    icon: UserPlus,
  },
  {
    title: "Hatásom",
    subtitle: "Közösségi eredményeid",
    route: "/my-impact",
    icon: Heart,
  },
  {
    title: "Kuponkód beváltása",
    subtitle: "Partner ajánlat aktiválása",
    route: "/redeem-coupon",
    icon: Ticket,
  },
  {
    title: "Segítség",
    subtitle: "Gyors válaszok és támogatás",
    route: "/help",
    icon: HelpCircle,
  },
];

const settingsMenu: ShortcutItem[] = [
  {
    title: "Fiók",
    subtitle: "Profiladatok és belépés",
    route: "/account",
    icon: User,
  },
  {
    title: "Fizetési módok",
    subtitle: "Kártyák és fizetési beállítások",
    route: "/payment-methods",
    icon: CreditCard,
  },
];

function formatDistance(value?: number | null): string {
  if (!value) return "Részletek";
  return `${(value / 1000).toFixed(1).replace(".", ",")} km`;
}

type FavoriteVenueCardProps = {
  venue: Venue;
  fallbackImageUri: string;
  onPress: () => void;
};

const FavoriteVenueCard: React.FC<FavoriteVenueCardProps> = ({ venue, fallbackImageUri, onPress }: FavoriteVenueCardProps) => {
  const imageUri = venue.image_url ?? venue.hero_image_url ?? fallbackImageUri;
  const category = venue.tags?.[0] ?? "Mentett hely";

  return (
    <TouchableOpacity onPress={onPress} style={styles.favoriteCard} activeOpacity={0.86}>
      <Image source={{ uri: imageUri }} style={styles.favoriteImage} accessibilityIgnoresInvertColors />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.82)"]} style={styles.favoriteOverlay}>
        <View style={styles.favoriteBadge}>
          <Heart size={10} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.favoriteBadgeText}>Kedvenc</Text>
        </View>
        <View>
          <Text style={styles.favoriteName} numberOfLines={1}>{venue.name}</Text>
          <Text style={styles.favoriteMeta} numberOfLines={1}>{category} · {formatDistance(venue.distance)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

type MenuRowProps = {
  item: ShortcutItem;
  onPress: () => void;
};

const MenuRow: React.FC<MenuRowProps> = ({ item, onPress }: MenuRowProps) => {
  const Icon = item.icon;

  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.menuIconWrap}>
        <Icon size={16} color="#00C8E8" />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
      </View>
      <ChevronRight size={16} color="rgba(255,255,255,0.30)" />
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { points } = useAppContext();
  const { favoriteVenues, isLoading: favoritesLoading, syncError } = useFavorites();
  const profileFavoriteVenues = favoriteVenues.slice(0, 5);
  const fallbackImageUri = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600";

  const stats: ProfileStat[] = [
    { label: "Pont", value: points.toLocaleString("hu-HU"), icon: Sparkles },
    { label: "Látogatás", value: "200+", icon: History },
    { label: "Kedvenc", value: String(favoriteVenues.length), icon: Heart },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PROFIL</Text>
            <Text style={styles.greeting}>Szia, Bence</Text>
            <Text style={styles.headerSubtitle}>Kezeld a pontjaidat, kedvenceidet és Come Get It aktivitásodat.</Text>
          </View>
          <TouchableOpacity style={styles.avatar} testID="profile-avatar" activeOpacity={0.82} onPress={() => router.push("/account")}>
            <User size={19} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/rewards-missions")} activeOpacity={0.9} testID="open-rewards-card" style={styles.memberCardTouch}>
          <View style={styles.memberCard}>
            <View style={styles.memberBadge}>
              <ShieldCheck size={11} color="rgba(0, 200, 232, 0.9)" />
              <Text style={styles.memberBadgeText}>Come Get It Club</Text>
            </View>

            <View style={styles.memberMainRow}>
              <View style={styles.memberContent}>
                <Text style={styles.memberLabel}>Aktuális egyenleg</Text>
                <View style={styles.memberPointsRow}>
                  <Text style={styles.memberPoints} testID="profile-points">{points.toLocaleString("hu-HU")}</Text>
                  <Text style={styles.memberPointsUnit}>pont</Text>
                </View>
              </View>
              <View style={styles.memberGiftRing}>
                <View style={styles.memberGiftRingInner}>
                  <Gift size={22} color="#00C8E8" strokeWidth={1.9} />
                </View>
              </View>
            </View>

            <View style={styles.memberCta}>
              <Text style={styles.memberCtaText}>Jutalmak megnyitása</Text>
              <ChevronRight size={17} color="#001014" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {stats.map((stat: ProfileStat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={styles.statCard}>
                <Icon size={15} color="#00C8E8" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((item: ShortcutItem) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={item.title} style={styles.quickActionCard} onPress={() => router.push(item.route)} activeOpacity={0.84}>
                <View style={styles.quickIconWrap}>
                  <Icon size={17} color="#00C8E8" />
                </View>
                <Text style={styles.quickTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.quickSubtitle}>{item.subtitle}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.inviteCard} onPress={() => router.push("/invite-friends")} activeOpacity={0.88}>
          <View style={styles.inviteIconWrap}>
            <UserPlus size={17} color="#00C8E8" />
          </View>
          <View style={styles.inviteTextBlock}>
            <Text style={styles.inviteTitle}>Hívj meg egy barátot</Text>
            <Text style={styles.inviteSubtitle}>Szerezz extra pontokat, ha csatlakozik és kipróbálja a partnereket.</Text>
          </View>
          <ChevronRight size={17} color="rgba(255,255,255,0.32)" />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Kedvenceid</Text>
              <Text style={styles.sectionSubtitle}>Gyorsan elérhető mentett helyek</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButtonContainer} onPress={() => router.push("/favorites")} activeOpacity={0.82}>
              <Text style={styles.viewAllButton}>Összes</Text>
            </TouchableOpacity>
          </View>

          {syncError ? <Text style={styles.favoriteErrorText}>{syncError}</Text> : null}
          {favoritesLoading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Kedvencek betöltése...</Text>
            </View>
          ) : profileFavoriteVenues.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoritesList}>
              {profileFavoriteVenues.map((venue: Venue) => (
                <FavoriteVenueCard
                  key={venue.id}
                  venue={venue}
                  fallbackImageUri={fallbackImageUri}
                  onPress={() => router.push(`/venue/${encodeURIComponent(String(venue.id))}` as Href)}
                />
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity style={styles.emptyCard} onPress={() => router.push("/(tabs)/home")} activeOpacity={0.85}>
              <Heart size={18} color="#00C8E8" />
              <Text style={styles.emptyText}>Még nincs kedvenc helyed. Ments el pár helyet a gyorsabb visszatéréshez.</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionTitle}>Gyors elérés</Text>
          </View>
          <View style={styles.menuContainer}>
            {accountMenu.map((item: ShortcutItem) => (
              <MenuRow key={item.title} item={item} onPress={() => router.push(item.route)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionTitle}>Beállítások</Text>
          </View>
          <View style={styles.menuContainer}>
            {settingsMenu.map((item: ShortcutItem) => (
              <MenuRow key={item.title} item={item} onPress={() => router.push(item.route)} />
            ))}
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
  scrollContent: {
    paddingTop: 52,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  eyebrow: {
    color: "rgba(0, 200, 232, 0.84)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  greeting: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 260,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  memberCardTouch: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.24)",
    backgroundColor: "rgba(8, 22, 28, 0.92)",
    shadowColor: "#00C8E8",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  memberCard: {
    padding: 15,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0, 200, 232, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    marginBottom: 12,
  },
  memberBadgeText: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  memberMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  memberContent: {
    flex: 1,
  },
  memberLabel: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  memberPointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
  },
  memberPoints: {
    color: "#00C8E8",
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  memberPointsUnit: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 14,
    fontWeight: "800",
  },
  memberGiftRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "rgba(0, 200, 232, 0.34)",
    justifyContent: "center",
    alignItems: "center",
  },
  memberGiftRingInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  memberCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 15,
    backgroundColor: "#00C8E8",
    paddingVertical: 13,
  },
  memberCtaText: {
    color: "#001014",
    fontSize: 13,
    fontWeight: "900",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 11,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  statLabel: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  quickActionCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickIconWrap: {
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
  quickTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 17,
  },
  quickSubtitle: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(10, 16, 22, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inviteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(0, 200, 232, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  inviteTextBlock: {
    flex: 1,
  },
  inviteTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },
  inviteSubtitle: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 11,
    gap: 16,
  },
  sectionHeaderCompact: {
    paddingHorizontal: 16,
    marginBottom: 11,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  viewAllButtonContainer: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: "rgba(0, 200, 232, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.16)",
  },
  viewAllButton: {
    fontSize: 12,
    color: "#00C8E8",
    fontWeight: "900",
  },
  favoriteErrorText: {
    marginHorizontal: 16,
    color: "#F6B17A",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  favoritesList: {
    paddingLeft: 16,
    paddingRight: 6,
  },
  favoriteCard: {
    width: 180,
    height: 136,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  favoriteImage: {
    width: "100%",
    height: "100%",
  },
  favoriteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 10,
  },
  favoriteBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.44)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  favoriteBadgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: "800",
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 3,
  },
  favoriteMeta: {
    fontSize: 11,
    color: "rgba(255,255,255,0.66)",
    fontWeight: "700",
  },
  emptyCard: {
    marginHorizontal: 16,
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  menuContainer: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  menuItem: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.14)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  menuTextBlock: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.42)",
    lineHeight: 15,
  },
});
