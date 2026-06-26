import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, useWindowDimensions } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import Colors from "@/constants/colors";
import RewardCard from "@/components/RewardCard";
import { useQuery } from "@tanstack/react-query";
import { fetchAppRewards } from "@/lib/supabaseProvider";
import type { Reward } from "@/types/reward";
import { mergeWithMockRewards } from "@/data/mockRewards";

export default function RewardsCategoryScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = (params.category ?? "all") as string;
  const { width } = useWindowDimensions();

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
  const isPaged = category !== "all";

  return (
    <View style={styles.container} testID="rewards-category-screen">
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
        }}
      />

      {rewardsQuery.isLoading && normalizedRewards.length === 0 ? (
        <View style={styles.empty} testID="rewards-category-loading">
          <Text style={styles.emptyText}>Jutalmak betöltése...</Text>
        </View>
      ) : isPaged ? (
        <ScrollView
          horizontal
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          snapToAlignment="center"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{}}
          testID="rewards-category-pager"
        >
          {filtered.map((item) => (
            <View key={item.id} style={{ width }}>
              <RewardCard reward={item} variant="page" />
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={[styles.empty, { width }]}>
              <Text style={styles.emptyText}>Nincs jutalom ebben a kategóriában.</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          snapToAlignment="start"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.verticalList}
          testID="rewards-all-list"
        >
          {filtered.map((item) => (
            <View key={item.id} style={{ width }}>
              <RewardCard reward={item} variant="page" />
            </View>
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
  grid: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  verticalList: {
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