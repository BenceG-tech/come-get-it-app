import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  BadgePercent,
  ChevronRight,
  Martini,
  Nfc,
  Send,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import BigRewardCard from "@/components/BigRewardCard";
import { router } from "expo-router";
import { useAppContext } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { fetchAppRewards } from "@/lib/supabaseProvider";
import type { Reward } from "@/types/reward";
import { mergeWithMockRewards } from "@/data/mockRewards";

const CYAN = "#00C8E8" as const;
const SERIF = Platform.select({ ios: "Georgia", default: "serif" }) as string;

const HERO_BG_URI = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80";
const CLUB_CARD_SOURCE = require("@/assets/images/club-card-glow.png");

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
    imageUri: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=900&q=80",
  },
  {
    key: "food",
    title: "Étel",
    subtitle: "Falak, vacsorák és partner ajánlatok",
    icon: UtensilsCrossed,
    accent: "#F6B17A",
    imageUri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80",
  },
  {
    key: "experience",
    title: "Élmények",
    subtitle: "VIP belépők és különleges esték",
    icon: Sparkles,
    accent: "#7DD3FC",
    imageUri: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80",
  },
  {
    key: "all",
    title: "Összes",
    subtitle: "Minden elérhető jutalom egy helyen",
    icon: BadgePercent,
    accent: "#1D6DFF",
    imageUri: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=900&q=80",
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

    return cleaned;
  }, [rewardsQuery.data]);

  const editorPicks = useMemo(() => normalizedRewards.slice(0, 5), [normalizedRewards]);
  const newRewards = useMemo(() => {
    const remaining = normalizedRewards.slice(5);
    return remaining.length > 0 ? remaining.slice(0, 5) : normalizedRewards.slice(0, 5);
  }, [normalizedRewards]);

  const { points } = useAppContext();

  const goToCategory = (cat: string) => {
    console.log("[Rewards] Navigate to category:", cat);
    router.push({ pathname: "/(tabs)/rewards-category/[category]", params: { category: cat } });
  };

  const cardWidth = 148;

  const renderSectionHeader = (title: string, subtitle: string, allKey?: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {allKey ? (
        <TouchableOpacity
          style={styles.sectionAllLink}
          onPress={() => goToCategory(allKey)}
          accessibilityRole="button"
          testID={`see-all-${allKey}`}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionAllText}>Összes</Text>
          <ChevronRight size={14} color={CYAN} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

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

        <View style={styles.heroCard} testID="link-card-hero">
          <ImageBackground source={{ uri: HERO_BG_URI }} style={styles.heroBg} imageStyle={styles.heroBgImage}>
            <LinearGradient
              colors={["rgba(4,8,11,0.86)", "rgba(4,8,11,0.93)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.heroContent}>
              <View style={styles.heroCardImageWrap}>
                <Image source={CLUB_CARD_SOURCE} style={styles.heroCardImage} resizeMode="contain" />
              </View>
              <Text style={styles.heroTitle}>Kapcsold össze a kártyádat</Text>
              <Text style={styles.heroSubtitle}>
                Kapcsold hozzá a bankkártyádat, és a pontok maguktól gyűlnek minden fizetéskor.
              </Text>
              <TouchableOpacity activeOpacity={0.88} accessibilityRole="button" testID="add-card-button" style={styles.heroCtaTouch}>
                <LinearGradient
                  colors={["#00E0FF", "#0090B8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroCta}
                >
                  <Nfc size={16} color="#001014" />
                  <Text style={styles.heroCtaText}>Kártya hozzáadása</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.section}>
          {renderSectionHeader("Szerkesztők kedvencei", "A legjobb beváltások ma estére", "all")}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {rewardsQuery.isLoading && editorPicks.length === 0 ? (
              <View style={styles.inlineState} testID="rewards-loading">
                <Text style={styles.inlineStateText}>Jutalmak betöltése...</Text>
              </View>
            ) : editorPicks.length === 0 ? (
              <View style={styles.inlineState} testID="rewards-empty">
                <Text style={styles.inlineStateText}>Jelenleg nincsenek elérhető jutalmak.</Text>
              </View>
            ) : (
              editorPicks.map((reward) => (
                <BigRewardCard
                  key={reward.id}
                  reward={reward}
                  width={cardWidth}
                  canRedeem={points >= reward.points_required}
                  testID={`editor-${reward.id}`}
                />
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          {renderSectionHeader("Új jutalmak", "A legfrissebb ajánlatok", "all")}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {newRewards.map((reward) => (
              <BigRewardCard
                key={reward.id}
                reward={reward}
                width={cardWidth}
                canRedeem={points >= reward.points_required}
                testID={`new-${reward.id}`}
              />
            ))}
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
          <View style={styles.referPointsChip}>
            <Text style={styles.referPointsChipText}>+500 p</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          {renderSectionHeader("Kategóriák", "Gyors út a megfelelő ajánlathoz")}

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
                  <View style={styles.categoryImageWrap}>
                    <Image source={{ uri: category.imageUri }} style={styles.categoryImage} resizeMode="cover" />
                    <LinearGradient
                      colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(6,9,12,0.9)"]}
                      locations={[0, 0.62, 1]}
                      style={styles.categoryImageFade}
                    />
                  </View>
                  <View style={styles.categoryBottomBar}>
                    <View style={styles.categoryTextBlock}>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      <Text style={styles.categorySubtitle} numberOfLines={2}>{category.subtitle}</Text>
                    </View>
                    <View style={[styles.categoryIconWrap, { borderColor: `${category.accent}55`, backgroundColor: `${category.accent}22` }]}>
                      <Icon size={17} color={category.accent} />
                    </View>
                  </View>
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
    lineHeight: 40,
    fontWeight: "700",
    fontFamily: SERIF,
    color: Colors.text,
    letterSpacing: -0.4,
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
    marginBottom: 22,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.24)",
    shadowColor: "#00C8E8",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    backgroundColor: "#04080B",
  },
  heroBg: {
    width: "100%",
  },
  heroBgImage: {
    resizeMode: "cover",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  heroCardImageWrap: {
    width: "100%",
    height: 150,
    marginBottom: 10,
    shadowColor: "#00C8E8",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroCardImage: {
    width: "100%",
    height: "100%",
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: 14,
  },
  heroCtaTouch: {
    width: "100%",
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  heroCtaText: {
    color: "#001014",
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    marginBottom: 13,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "700",
    fontFamily: SERIF,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  sectionAllLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sectionAllText: {
    color: CYAN,
    fontSize: 13,
    fontWeight: "800",
  },
  horizontalList: {
    paddingLeft: 18,
    paddingRight: 6,
  },
  inlineState: {
    width: 260,
    minHeight: 200,
    justifyContent: "center",
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  inlineStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
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
    borderColor: "rgba(0, 200, 232, 0.18)",
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
    marginRight: 10,
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
  referPointsChip: {
    backgroundColor: CYAN,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  referPointsChipText: {
    color: "#001014",
    fontSize: 12,
    fontWeight: "900",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    borderRadius: 20,
    backgroundColor: "#06090C",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    overflow: "hidden",
  },
  categoryImageWrap: {
    width: "100%",
    height: 108,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryImageFade: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 68,
    backgroundColor: "#06090C",
  },
  categoryTextBlock: {
    flex: 1,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  categoryTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 3,
  },
  categorySubtitle: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 11,
    lineHeight: 15,
  },
});
