import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, useWindowDimensions } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import Colors from "@/constants/colors";
import { rewards } from "@/data/rewards";
import RewardCard from "@/components/RewardCard";

export default function RewardsCategoryScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = (params.category ?? "all") as string;
  const { width } = useWindowDimensions();

  const filtered = useMemo(() => {
    if (category === "all") return rewards;
    return rewards.filter((r) => r.category === category);
  }, [category]);

  const titleMap: Record<string, string> = {
    drinks: "Italok",
    food: "Étel",
    lifestyle: "Életmód",
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

      {isPaged ? (
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
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {filtered.map((item) => (
            <RewardCard key={item.id} reward={item} />
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
  empty: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textSecondary,
  },
});