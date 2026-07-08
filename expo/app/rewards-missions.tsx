import { useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Beer,
  Building2,
  Cake,
  CalendarClock,
  Camera,
  Crown,
  CupSoda,
  Flame,
  Gift,
  Landmark,
  MapPin,
  Martini,
  Moon,
  PartyPopper,
  Rocket,
  Smartphone,
  Sparkles,
  Star,
  Sunrise,
  Trophy,
  UserPlus,
  Users,
  Wine,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";

const CYAN = "#00C8E8" as const;

type MissionCategory = "visits" | "redeems" | "social" | "app";

type Mission = {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number;
  total: number;
  icon: LucideIcon;
  color: string;
  category: MissionCategory;
  isCompleted: boolean;
  expiryDate?: string;
};

type CategoryTab = {
  key: MissionCategory;
  label: string;
  icon: LucideIcon;
};

const categoryTabs: CategoryTab[] = [
  { key: "visits", label: "Látogatások", icon: MapPin },
  { key: "redeems", label: "Beváltások", icon: Martini },
  { key: "social", label: "Közösség", icon: Users },
  { key: "app", label: "App használat", icon: Smartphone },
];

const missions: Mission[] = [
  { id: "1", title: "7 napos sorozat", description: "Látogass meg 7 egymást követő napon különböző vendéglátóhelyeket!", points: 800, progress: 3, total: 7, icon: Flame, color: "#FF8A3D", category: "visits", isCompleted: false },
  { id: "2", title: "Ruin Bar Felfedező", description: "Látogass meg 5 különböző ruin bart!", points: 600, progress: 2, total: 5, icon: Landmark, color: "#A78BFA", category: "visits", isCompleted: false },
  { id: "3", title: "Craft Beer Rajongó", description: "Látogass meg 10 craft beer helyet!", points: 700, progress: 4, total: 10, icon: Beer, color: "#F6B93B", category: "visits", isCompleted: false, expiryDate: "2026. 11. 30." },
  { id: "4", title: "Rooftop Vadász", description: "Látogass meg 3 különböző rooftop bart!", points: 500, progress: 1, total: 3, icon: Building2, color: "#7DD3FC", category: "visits", isCompleted: false },
  { id: "5", title: "Wine Bar Szakértő", description: "Látogass meg 5 wine bart!", points: 550, progress: 0, total: 5, icon: Wine, color: "#E85D75", category: "visits", isCompleted: false },
  { id: "6", title: "Cocktail Bar Mester", description: "Látogass meg 8 cocktail bart!", points: 650, progress: 3, total: 8, icon: Martini, color: "#00C8E8", category: "visits", isCompleted: false },
  { id: "7", title: "Éjszakai Bagoly", description: "Látogass meg egy helyet éjfél után!", points: 300, progress: 0, total: 1, icon: Moon, color: "#9B8CFF", category: "visits", isCompleted: false },
  { id: "8", title: "Early Bird", description: "Látogass meg egy helyet délelőtt 11-ig!", points: 300, progress: 0, total: 1, icon: Sunrise, color: "#FFD646", category: "visits", isCompleted: false },
  { id: "9", title: "Hétvégi Harcos", description: "Látogass meg 5 helyet hétvégén!", points: 450, progress: 2, total: 5, icon: PartyPopper, color: "#FB7185", category: "visits", isCompleted: false },
  { id: "10", title: "Visszatérő Vendég", description: "Látogass meg ugyanazt a helyet 3 egymást követő héten!", points: 600, progress: 1, total: 3, icon: CalendarClock, color: "#34D399", category: "visits", isCompleted: false },

  { id: "13", title: "Sör Mester", description: "Válts be 10 ingyen sört!", points: 500, progress: 3, total: 10, icon: Beer, color: "#F6B93B", category: "redeems", isCompleted: false, expiryDate: "2026. 10. 31." },
  { id: "14", title: "Koktél Guru", description: "Válts be 5 ingyen koktélt!", points: 400, progress: 1, total: 5, icon: Martini, color: "#00C8E8", category: "redeems", isCompleted: false, expiryDate: "2026. 10. 31." },
  { id: "15", title: "Wine Connoisseur", description: "Válts be 8 ingyen bort!", points: 600, progress: 2, total: 8, icon: Wine, color: "#E85D75", category: "redeems", isCompleted: false, expiryDate: "2026. 12. 31." },
  { id: "16", title: "Shot Master", description: "Válts be 15 ingyen shotot!", points: 450, progress: 7, total: 15, icon: Zap, color: "#FFD646", category: "redeems", isCompleted: false, expiryDate: "2026. 11. 15." },
  { id: "18", title: "Gin & Tonic Fan", description: "Válts be 7 ingyen gin tonicot!", points: 420, progress: 3, total: 7, icon: CupSoda, color: "#34D399", category: "redeems", isCompleted: false, expiryDate: "2026. 10. 31." },
  { id: "19", title: "Prosecco Party", description: "Válts be 4 ingyen proseccot!", points: 480, progress: 1, total: 4, icon: PartyPopper, color: "#F6B17A", category: "redeems", isCompleted: false, expiryDate: "2026. 11. 30." },

  { id: "21", title: "Barát Meghívó", description: "Hívd meg egy barátodat, aki először használja a Come Get It appot!", points: 400, progress: 0, total: 1, icon: UserPlus, color: "#34D399", category: "social", isCompleted: false },
  { id: "22", title: "Társaság Szervező", description: "Látogass meg 5 helyet barátokkal együtt!", points: 600, progress: 2, total: 5, icon: Users, color: "#7DD3FC", category: "social", isCompleted: false },
  { id: "24", title: "Csapat Kapitány", description: "Hívj meg 3 barátot, akik mind használják az appot!", points: 900, progress: 1, total: 3, icon: Crown, color: "#FFD646", category: "social", isCompleted: false },
  { id: "25", title: "Születésnapi Buli", description: "Ünnepelj egy születésnapot 5+ fővel egy helyen!", points: 500, progress: 0, total: 1, icon: Cake, color: "#FB7185", category: "social", isCompleted: false },

  { id: "28", title: "App Használó - Kezdő", description: "Használd az appot 5 napon keresztül!", points: 200, progress: 5, total: 5, icon: Smartphone, color: "#00C8E8", category: "app", isCompleted: true },
  { id: "29", title: "App Használó - Haladó", description: "Használd az appot 10 napon keresztül!", points: 400, progress: 8, total: 10, icon: Rocket, color: "#A78BFA", category: "app", isCompleted: false },
  { id: "30", title: "App Használó - Mester", description: "Használd az appot 20 napon keresztül!", points: 800, progress: 8, total: 20, icon: Trophy, color: "#FFD646", category: "app", isCompleted: false },
  { id: "32", title: "Értékelő", description: "Értékelj 10 helyet az appban!", points: 300, progress: 3, total: 10, icon: Star, color: "#F6B93B", category: "app", isCompleted: false },
  { id: "33", title: "Fotós", description: "Tölts fel 15 fotót helyekről!", points: 450, progress: 6, total: 15, icon: Camera, color: "#FB7185", category: "app", isCompleted: false },
  { id: "34", title: "Check-in Bajnok", description: "Végezz 25 check-int különböző helyeken!", points: 750, progress: 12, total: 25, icon: MapPin, color: "#34D399", category: "app", isCompleted: false },
];

const BG_URI = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/nuxl82z0l3d1zls67c787";

export default function RewardsMissionsScreen() {
  const router = useRouter();
  const { points } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<MissionCategory>("visits");

  const filteredMissions = useMemo(() => {
    return missions
      .filter((m) => m.category === activeCategory)
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return b.progress / b.total - a.progress / a.total;
      });
  }, [activeCategory]);

  const renderMissionCard = (mission: Mission) => {
    const Icon = mission.icon;
    const ratio = mission.total > 0 ? mission.progress / mission.total : 0;
    const isAlmostDone = !mission.isCompleted && ratio >= 0.6;

    return (
      <View
        key={mission.id}
        style={[styles.missionCard, isAlmostDone && styles.missionCardHighlight, mission.isCompleted && styles.missionCardDone]}
        testID={`mission-${mission.id}`}
      >
        <View style={styles.missionTopRow}>
          <View
            style={[
              styles.missionIconWrap,
              { backgroundColor: `${mission.color}1A`, borderColor: `${mission.color}40` },
              isAlmostDone && { backgroundColor: `${mission.color}2E`, borderColor: `${mission.color}66` },
            ]}
          >
            <Icon size={19} color={mission.color} strokeWidth={1.9} />
          </View>
          <View style={styles.missionTextBlock}>
            <Text style={styles.missionTitle} numberOfLines={1}>{mission.title}</Text>
            <Text style={styles.missionDescription} numberOfLines={2}>{mission.description}</Text>
          </View>
          <View style={[styles.pointsBadge, mission.isCompleted && styles.pointsBadgeDone]}>
            <Text style={[styles.pointsBadgeText, mission.isCompleted && styles.pointsBadgeTextDone]}>
              {mission.isCompleted ? "Kész" : `+${mission.points}`}
            </Text>
          </View>
        </View>

        <View style={styles.missionBottomRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(ratio * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressCount}>{mission.progress}/{mission.total}</Text>
        </View>

        {mission.expiryDate ? (
          <View style={styles.expiryRow}>
            <CalendarClock size={11} color="rgba(255,255,255,0.42)" />
            <Text style={styles.expiryText}>{mission.expiryDate}-ig érvényes</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: BG_URI }} style={StyleSheet.absoluteFillObject as object} resizeMode="cover" imageStyle={styles.bgImage} />
      <LinearGradient
        colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.88)", "#000000"]}
        locations={[0, 0.4, 0.85]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Vissza">
            <ArrowLeft size={19} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Küldetések</Text>
          <View style={styles.pointsPill} testID="rewards-missions-points">
            <Sparkles size={13} color="#001014" />
            <Text style={styles.pointsPillText}>{points.toLocaleString("hu-HU")}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.rewardsShortcut}
          activeOpacity={0.88}
          onPress={() => router.push("/(tabs)/rewards")}
          testID="rewards-missions-open-rewards"
        >
          <Gift size={14} color={CYAN} />
          <Text style={styles.rewardsShortcutText} numberOfLines={1}>Pontjaid beváltása a Jutalmak fülön</Text>
        </TouchableOpacity>

        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {categoryTabs.map((tab: CategoryTab) => {
              const Icon = tab.icon;
              const active = activeCategory === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveCategory(tab.key)}
                  activeOpacity={0.85}
                  testID={`mission-tab-${tab.key}`}
                >
                  <Icon size={14} color={active ? "#001014" : "rgba(255,255,255,0.62)"} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.missionsList}>
          {filteredMissions.map(renderMissionCard)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  bgImage: {
    opacity: 0.55,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: CYAN,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  pointsPillText: {
    color: "#001014",
    fontSize: 13,
    fontWeight: "900",
  },
  rewardsShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.22)",
  },
  rewardsShortcutText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 12.5,
    fontWeight: "700",
  },
  tabsWrap: {
    marginBottom: 10,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  tabActive: {
    backgroundColor: CYAN,
    borderColor: CYAN,
  },
  tabText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#001014",
  },
  missionsList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  missionCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(10, 16, 22, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  missionCardHighlight: {
    borderColor: "rgba(0, 200, 232, 0.38)",
    backgroundColor: "rgba(8, 28, 34, 0.86)",
  },
  missionCardDone: {
    opacity: 0.62,
  },
  missionTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 12,
  },
  missionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  missionTextBlock: {
    flex: 1,
  },
  missionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  missionDescription: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 12,
    lineHeight: 16,
  },
  pointsBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.28)",
  },
  pointsBadgeDone: {
    backgroundColor: "rgba(76, 175, 80, 0.14)",
    borderColor: "rgba(76, 175, 80, 0.32)",
  },
  pointsBadgeText: {
    color: CYAN,
    fontSize: 12,
    fontWeight: "900",
  },
  pointsBadgeTextDone: {
    color: "#4CAF50",
  },
  missionBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: CYAN,
  },
  progressCount: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "800",
    minWidth: 36,
    textAlign: "right",
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
  },
  expiryText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "600",
  },
});
