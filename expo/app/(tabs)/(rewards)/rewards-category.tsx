import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import RewardListCard from "@/components/RewardListCard";
import { useQuery } from "@tanstack/react-query";
import { fetchAppRewards } from "@/lib/supabaseProvider";
import type { Reward } from "@/types/reward";
import { useAppContext } from "@/context/AppContext";
import { getAvailableRewards } from "@/lib/rewardUtils";

const SUPPORTED_CATEGORIES = new Set(["drink", "food", "vip", "discount", "experience", "partner", "all"]);

export default function RewardsCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const requestedCategory = (params.category ?? "all") as string;
  const category = SUPPORTED_CATEGORIES.has(requestedCategory) ? requestedCategory : "all";
  const { points } = useAppContext();

  const rewardsQuery = useQuery({
    queryKey: ["rewards", "app"],
    queryFn: async () => {
      const res = await fetchAppRewards();
      return res;
    },
    staleTime: 60_000,
    retry: 1,
  });

  const normalizedRewards = useMemo(() => {
    const raw = (rewardsQuery.data ?? []) as Reward[];
    const cleaned = getAvailableRewards(raw);

    console.log("[RewardsCategory] normalizedRewards", { category, rawCount: raw.length, cleanedCount: cleaned.length });
    return cleaned;
  }, [rewardsQuery.data, category]);

  const filtered = useMemo(() => {
    if (category === "all") return normalizedRewards;
    return normalizedRewards.filter((r) => (r.category ?? "") === category);
  }, [category, normalizedRewards]);

  const titleMap: Record<string, string> = {
    drink: "Italok",
    food: "Étel",
    vip: "VIP",
    discount: "Kedvezmény",
    experience: "Élmények",
    partner: "Partnerek",
    all: "Összes jutalom",
  };

  const title = titleMap[category] ?? category;

  const goBackToRewards = () => {
    router.dismissTo("/(tabs)/(rewards)/rewards");
  };

  return (
      <View style={styles.container} testID="rewards-category-screen">
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={goBackToRewards}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Vissza a Jutalmakhoz"
            testID="rewards-category-back"
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <ArrowLeft size={23} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {rewardsQuery.isLoading && normalizedRewards.length === 0 ? (
          <View style={styles.empty} testID="rewards-category-loading">
            <Text style={styles.emptyText}>Jutalmak betöltése...</Text>
          </View>
        ) : rewardsQuery.isError && normalizedRewards.length === 0 ? (
          <View style={styles.empty} testID="rewards-category-error">
            <Text style={styles.emptyTitle}>A jutalmak most nem tölthetők be</Text>
            <Text style={styles.emptyText}>Ellenőrizd a kapcsolatot, majd próbáld újra.</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => rewardsQuery.refetch()}
              accessibilityRole="button"
              accessibilityLabel="Jutalmak újrapróbálása"
              testID="rewards-category-retry"
            >
              <RefreshCw size={15} color="#001014" />
              <Text style={styles.retryButtonText}>Újrapróbálás</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verticalList}
            testID="rewards-category-list"
          >
            {filtered.map((item) => (
              <RewardListCard key={item.id} reward={item} points={points} />
            ))}
            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Ebben a kategóriában még nincs aktív jutalom</Text>
                <Text style={styles.emptyText}>Nézz vissza később, vagy válassz másik kategóriát.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#242424",
    backgroundColor: "#000000",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#090909",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  verticalList: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  empty: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  retryButton: {
    minHeight: 42,
    marginTop: 16,
    paddingHorizontal: 18,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#00C8E8",
  },
  retryButtonText: {
    color: "#001014",
    fontSize: 13,
    fontWeight: "900",
  },
});
