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
  MapPin,
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

type RecentVenue = {
  id: string;
  name: string;
  description: string;
  distance: string;
  status: "Nyitva" | "Zárva";
  imageUri: string;
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
    subtitle: "A Come Get It aktivitásod",
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
    subtitle: "Kérdések és ügyféltámogatás",
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
    subtitle: "Mentett kártyák kezelése",
    route: "/payment-methods",
    icon: CreditCard,
  },
  {
    title: "Címeim",
    subtitle: "Mentett helyek és adatok",
    route: "/addresses",
    icon: MapPin,
  },
  {
    title: "Rendelési előzmények",
    subtitle: "Korábbi rendelések",
    route: "/order-history",
    icon: History,
  },
];

const recentVenues: RecentVenue[] = [
  {
    id: "4",
    name: "Doblo Wine Bar",
    description: "Borok, tapasok és esti jazz hangulat a belvárosban.",
    distance: "0,4 km",
    status: "Zárva",
    imageUri: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "5",
    name: "Boutiq Bar",
    description: "Signature koktélok és prémium bárélmény.",
    distance: "0,6 km",
    status: "Nyitva",
    imageUri: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "6",
    name: "Élesztő Craft Beer Garden",
    description: "Craft sörök, laza udvarhangulat és baráti esték.",
    distance: "1,2 km",
    status: "Nyitva",
    imageUri: "https://images.unsplash.com/photo-1555658636-6e4a36218be7?auto=format&fit=crop&w=900&q=80",
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
          <Heart size={11} color="#FFFFFF" fill="#FFFFFF" />
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
        <Icon size={18} color="#00C8E8" />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color="rgba(255,255,255,0.36)" />
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
            <User size={21} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/rewards-missions")} activeOpacity={0.9} testID="open-rewards-card" style={styles.memberCardTouch}>
          <LinearGradient
            colors={["rgba(0, 200, 232, 0.22)", "rgba(29, 109, 255, 0.13)", "rgba(10, 16, 22, 0.90)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.memberCard}
          >
            <View style={styles.memberTopRow}>
              <View style={styles.memberBadge}>
                <Gift size={14} color="rgba(255,255,255,0.82)" />
                <Text style={styles.memberBadgeText}>Come Get It Club</Text>
              </View>
              <ShieldCheck size={20} color="rgba(0, 200, 232, 0.96)" />
            </View>

            <View style={styles.memberContent}>
              <Text style={styles.memberLabel}>Aktuális egyenleg</Text>
              <Text style={styles.memberPoints} testID="profile-points">{points.toLocaleString("hu-HU")}</Text>
              <Text style={styles.memberHint}>Pontjaid beválthatók italokra, kedvezményekre és élményekre.</Text>
            </View>

            <View style={styles.memberCta}>
              <Text style={styles.memberCtaText}>Jutalmak megnyitása</Text>
              <ChevronRight size={18} color="#001014" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {stats.map((stat: ProfileStat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={styles.statCard}>
                <Icon size={17} color="#00C8E8" />
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
                  <Icon size={19} color="#00C8E8" />
                </View>
                <Text style={styles.quickTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.quickSubtitle}>{item.subtitle}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.inviteCard} onPress={() => router.push("/invite-friends")} activeOpacity={0.88}>
          <View style={styles.inviteIconWrap}>
            <UserPlus size={19} color="#00C8E8" />
          </View>
          <View style={styles.inviteTextBlock}>
            <Text style={styles.inviteTitle}>Hívj meg egy barátot</Text>
            <Text style={styles.inviteSubtitle}>Szerezz extra pontokat, ha csatlakozik és kipróbálja a partnereket.</Text>
          </View>
          <ChevronRight size={19} color="rgba(255,255,255,0.38)" />
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
              <Heart size={21} color="#00C8E8" />
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
            <Text style={styles.sectionTitle}>Látogasd meg újra</Text>
          </View>
          <View style={styles.recentList}>
            {recentVenues.map((venue: RecentVenue) => (
              <TouchableOpacity key={venue.id} onPress={() => router.push(`/venue/${venue.id}` as Href)} style={styles.recentItem} activeOpacity={0.84}>
                <Image source={{ uri: venue.imageUri }} style={styles.recentImage} accessibilityIgnoresInvertColors />
                <View style={styles.recentInfo}>
                  <View style={styles.recentTitleRow}>
                    <Text style={styles.recentName} numberOfLines={1}>{venue.name}</Text>
                    <Text style={[styles.statusBadge, venue.status === "Nyitva" ? styles.statusOpen : styles.statusClosed]}>{venue.status}</Text>
                  </View>
                  <Text style={styles.recentDescription} numberOfLines={2}>{venue.description}</Text>
                  <Text style={styles.recentDistance}>{venue.distance}</Text>
                </View>
              </TouchableOpacity>
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
    paddingTop: 58,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 18,
    gap: 16,
  },
  eyebrow: {
    color: "rgba(0, 200, 232, 0.86)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  greeting: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
    maxWidth: 278,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    justifyContent: "center",
    alignItems: "center",
  },
  memberCardTouch: {
    marginHorizontal: 18,
    marginBottom: 13,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(10,16,22,0.80)",
  },
  memberCard: {
    padding: 18,
    minHeight: 204,
  },
  memberTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
  },
  memberBadgeText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
  },
  memberContent: {
    flex: 1,
  },
  memberLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  memberPoints: {
    color: "#00C8E8",
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  memberHint: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 260,
  },
  memberCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "#00C8E8",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  memberCtaText: {
    color: "#001014",
    fontSize: 14,
    fontWeight: "900",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  statValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  statLabel: {
    color: "rgba(255,255,255,0.47)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  quickGrid: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 14,
  },
  quickActionCard: {
    flex: 1,
    minHeight: 130,
    borderRadius: 20,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.20)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },
  quickTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
  },
  quickSubtitle: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    marginBottom: 24,
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(10, 16, 22, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  inviteIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.20)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  inviteTextBlock: {
    flex: 1,
  },
  inviteTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 3,
  },
  inviteSubtitle: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    marginBottom: 13,
    gap: 16,
  },
  sectionHeaderCompact: {
    paddingHorizontal: 18,
    marginBottom: 13,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  viewAllButtonContainer: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
  },
  viewAllButton: {
    fontSize: 13,
    color: "#00C8E8",
    fontWeight: "900",
  },
  favoriteErrorText: {
    marginHorizontal: 18,
    color: "#F6B17A",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  favoritesList: {
    paddingLeft: 18,
    paddingRight: 6,
  },
  favoriteCard: {
    width: 204,
    height: 154,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  favoriteImage: {
    width: "100%",
    height: "100%",
  },
  favoriteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 12,
  },
  favoriteBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },
  favoriteBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 4,
  },
  favoriteMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "700",
  },
  emptyCard: {
    marginHorizontal: 18,
    minHeight: 108,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.045)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 9,
  },
  emptyText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  menuContainer: {
    marginHorizontal: 18,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  menuItem: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(0, 200, 232, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTextBlock: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 3,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.46)",
    lineHeight: 16,
  },
  recentList: {
    marginHorizontal: 18,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  recentImage: {
    width: 66,
    height: 66,
    borderRadius: 17,
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  recentName: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  statusBadge: {
    overflow: "hidden",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    fontSize: 10,
    fontWeight: "900",
  },
  statusOpen: {
    color: "#001014",
    backgroundColor: "#00C8E8",
  },
  statusClosed: {
    color: "rgba(255,255,255,0.68)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  recentDescription: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 5,
  },
  recentDistance: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "800",
  },
});
