import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import RewardListCard from "@/components/RewardListCard";
import { useQuery } from "@tanstack/react-query";
import { fetchAppRewards } from "@/lib/supabaseProvider";
import type { Reward } from "@/types/reward";
import { useAppContext } from "@/context/AppContext";

export default function RewardsCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const category = (params.category ?? "all") as string;
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
    experience: "Élmény",
    partner: "Partnerek",
    all: "Összes jutalom",
  };

  const title = titleMap[category] ?? category;

  return (
    <View style={styles.container} testID="rewards-category-screen">
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/rewards")}
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
              <Text style={styles.emptyText}>Nincs jutalom ebben a kategóriában.</Text>
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
  },
});
