import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import Colors from "@/constants/colors";
import { rewards } from "@/data/rewards";
import RewardCard from "@/components/RewardCard";

export default function RewardsCategoryScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = (params.category ?? "all") as string;

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

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.verticalList}
        testID="rewards-category-list"
      >
        {filtered.map((item) => (
          <RewardCard key={item.id} reward={item} variant="list" />
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nincs jutalom ebben a kategóriában.</Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
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