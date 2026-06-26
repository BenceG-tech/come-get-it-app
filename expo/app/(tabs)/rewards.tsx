import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  BadgePercent,
  ChevronRight,
  CreditCard,
  Gift,
  Martini,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import RewardCard from "@/components/RewardCard";
import { router } from "expo-router";
import { useAppContext } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { fetchAppRewards } from "@/lib/supabaseProvider";
import type { Reward } from "@/types/reward";
import { mergeWithMockRewards } from "@/data/mockRewards";

type RewardCategoryItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  imageUri: string;
};

const rewardCategories: RewardCategoryItem[] = [
  {
    key: "drink",
    title: "Italok",
    subtitle: "Koktélok, sörök, napi ajándékok",
    icon: Martini,
    accent: "#00C8E8",
    imageUri: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=900",
  },
  {
    key: "food",
    title: "Étel",
    subtitle: "Falak, vacsorák és partner ajánlatok",
    icon: UtensilsCrossed,
    accent: "#F6B17A",
    imageUri: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=900",
  },
  {
    key: "experience",
    title: "Élmények",
    subtitle: "VIP belépők és különleges esték",
    icon: Sparkles,
    accent: "#7DD3FC",
    imageUri: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900",
  },
  {
    key: "all",
    title: "Összes",
    subtitle: "Minden elérhető jutalom egy helyen",
    icon: BadgePercent,
    accent: "#1D6DFF",
    imageUri: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900",
  },
];

export default function RewardsScreen() {
  const rewardsQuery = useQuery({
    queryKey: ["rewards", "app"],
    queryFn: async () => {
      console.log("[Rewards] queryFn start");
      const res = await fetchAppRewards();
      console.log("[Rewards] queryFn success", { count: res.length });
      return res;
    },
    staleTime: 60_000,
    retry: 2,
  });

  const normalizedRewards = useMemo(() => {
    const raw = mergeWithMockRewards((rewardsQuery.data ?? []) as Reward[]);
    const today = new Date();
    const cleaned = raw
      .filter((r) => {
        if (!r) return false;
        if (r.active === false) return false;
        const until = new Date(r.valid_until);
        if (!Number.isNaN(until.getTime()) && until.getTime() < today.getTime()) return false;
        return true;
      })
      .sort((a, b) => {
        const ap = a.priority ?? 0;
        const bp = b.priority ?? 0;
        if (bp !== ap) return bp - ap;
        return a.points_required - b.points_required;
      });

    console.log("[Rewards] normalizedRewards", {
      rawCount: raw.length,
      cleanedCount: cleaned.length,
      categories: Array.from(new Set(cleaned.map((r) => r.category ?? ""))),
    });

    return cleaned;
  }, [rewardsQuery.data]);

  const filteredEditorPicks = useMemo(() => {
    return normalizedRewards.slice(0, 3);
  }, [normalizedRewards]);

  const { points } = useAppContext();
  const nextReward = normalizedRewards.find((reward: Reward) => reward.points_required > points);
  const closestRewardCost = nextReward?.points_required ?? 2500;
  const progress = Math.min(points / Math.max(closestRewardCost, 1), 1);

  const goToCategory = (cat: string) => {
    console.log("[Rewards] Navigate to category:", cat);
    router.push({ pathname: "/(tabs)/rewards-category/[category]", params: { category: cat } });
  };

  return (
    <View style={styles.container} testID="rewards-screen">
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.eyebrow}>COME GET IT CLUB</Text>
            <Text style={styles.title}>Jutalmak</Text>
            <Text style={styles.subtitle}>Gyűjts pontokat, válts be italokat, kedvezményeket és exkluzív élményeket.</Text>
          </View>
          <View style={styles.pointsPill}>
            <Sparkles size={14} color="#001014" />
            <Text style={styles.pointsPillText}>{points.toLocaleString("hu-HU")}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.heroCard} activeOpacity={0.9} accessibilityRole="button" testID="add-card-button">
          <LinearGradient
            colors={["rgba(0, 200, 232, 0.20)", "rgba(29, 109, 255, 0.10)", "rgba(10, 16, 22, 0.86)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <CreditCard size={21} color="#00C8E8" />
              </View>
              <View style={styles.secureBadge}>
                <ShieldCheck size={13} color="rgba(255,255,255,0.76)" />
                <Text style={styles.secureBadgeText}>Biztonságos</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Kapcsold hozzá a kártyád</Text>
            <Text style={styles.heroSubtitle}>Automatikusan pontot kapsz, amikor partnerhelyeinken fizetsz. Nem terhelünk meg külön.</Text>
            <View style={styles.heroActionRow}>
              <Text style={styles.heroActionText}>Kártya hozzáadása</Text>
              <ChevronRight size={17} color="#001014" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Következő jutalom</Text>
              <Text style={styles.progressTitle}>{nextReward ? nextReward.name : "Új partner ajánlat"}</Text>
            </View>
            <Text style={styles.progressPoints}>{Math.max(closestRewardCost - points, 0).toLocaleString("hu-HU")} pont</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Kiemelt ajánlatok</Text>
              <Text style={styles.sectionSubtitle}>A legjobb beváltások ma estére</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {rewardsQuery.isLoading && filteredEditorPicks.length === 0 ? (
              <View style={styles.inlineState} testID="rewards-loading">
                <Text style={styles.inlineStateText}>Jutalmak betöltése...</Text>
              </View>
            ) : filteredEditorPicks.length === 0 ? (
              <View style={styles.inlineState} testID="rewards-empty">
                <Text style={styles.inlineStateText}>Jelenleg nincsenek elérhető jutalmak.</Text>
              </View>
            ) : (
              filteredEditorPicks.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  canRedeem={points >= reward.points_required}
                  onRedeem={(r) => {
                    console.log("[Rewards] redeem pressed", { rewardId: r.id });
                    if (points < r.points_required) return;
                  }}
                />
              ))
            )}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.referButton} testID="refer-friend" activeOpacity={0.88} onPress={() => router.push("/invite-friends")}>
          <View style={styles.referIconWrap}>
            <Send size={19} color="#00C8E8" />
          </View>
          <View style={styles.referTextContainer}>
            <Text style={styles.referTitle}>Hívj meg egy barátot</Text>
            <Text style={styles.referSubtitle}>500 pont jár, amikor csatlakozik és használja az appot.</Text>
          </View>
          <ChevronRight size={19} color="rgba(255,255,255,0.42)" />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Kategóriák</Text>
              <Text style={styles.sectionSubtitle}>Gyors út a megfelelő ajánlathoz</Text>
            </View>
          </View>

          <View style={styles.categoriesGrid}>
            {rewardCategories.map((category: RewardCategoryItem) => {
              const Icon = category.icon;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={styles.categoryCard}
                  onPress={() => goToCategory(category.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.title} kategória`}
                  testID={`cat-${category.key}`}
                  activeOpacity={0.86}
                >
                  <Image source={{ uri: category.imageUri }} style={styles.categoryImage} resizeMode="cover" />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.72)", "rgba(0,0,0,0.92)"]}
                    locations={[0, 0.48, 1]}
                    style={styles.categoryOverlay}
                  />
                  <View style={[styles.categoryIconWrap, { borderColor: `${category.accent}55`, backgroundColor: `${category.accent}26` }]}>
                    <Icon size={21} color={category.accent} />
                  </View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle} numberOfLines={2}>{category.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
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
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 18,
    gap: 14,
  },
  headerTextBlock: {
    flex: 1,
  },
  eyebrow: {
    color: "rgba(0, 200, 232, 0.86)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
    maxWidth: 282,
  },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#00C8E8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#00C8E8",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pointsPillText: {
    color: "#001014",
    fontSize: 13,
    fontWeight: "900",
  },
  heroCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(10,16,22,0.78)",
  },
  heroGradient: {
    padding: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  secureBadgeText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 7,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 17,
  },
  heroActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "#00C8E8",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  heroActionText: {
    color: "#001014",
    fontSize: 14,
    fontWeight: "900",
  },
  progressCard: {
    marginHorizontal: 18,
    marginBottom: 26,
    borderRadius: 18,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  progressLabel: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  progressTitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "800",
    maxWidth: 210,
  },
  progressPoints: {
    color: "#00C8E8",
    fontSize: 13,
    fontWeight: "900",
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#00C8E8",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
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
  horizontalList: {
    paddingLeft: 18,
    paddingRight: 6,
  },
  inlineState: {
    width: 260,
    minHeight: 112,
    justifyContent: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  inlineStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  referButton: {
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
  referIconWrap: {
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
  referTextContainer: {
    flex: 1,
  },
  referTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },
  referSubtitle: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    lineHeight: 18,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    minHeight: 152,
    borderRadius: 20,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 13,
  },
  categoryTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  categorySubtitle: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 12,
    lineHeight: 17,
  },
});
