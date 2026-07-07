import { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  X,
  Wine,
  Beer,
  UtensilsCrossed,
  Users,
  GraduationCap,
  Headphones,
  Heart,
  Crown,
  Dog,
  DollarSign,
  Pizza,
  Dices,
  Sun,
  Building2,
  Martini,
  GlassWater,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { filterCategories } from "@/data/filters";

const CYAN = "#00C8E8" as const;

const filterIconMap: Record<string, LucideIcon> = {
  "free-drink": GlassWater,
  "reward-bar": Star,
  "el-jimador": Martini,
  "lillet-spritz": Wine,
  "cornish-orchards": Beer,
  "pub-garden": Sun,
  "student-friendly": GraduationCap,
  "listening-bars": Headphones,
  "small-plates": UtensilsCrossed,
  "groups": Users,
  "date-night": Heart,
  "female-owned": Crown,
  "new-bars": Sparkles,
  "foodie-spots": Pizza,
  cocktails: Martini,
  pub: Beer,
  wine: Wine,
  "craft-beer": Beer,
  "dog-friendly": Dog,
  baller: DollarSign,
  "street-food": Pizza,
  "organised-fun": Dices,
  outdoor: Sun,
  rooftop: Building2,
};

export default function FilterScreen() {
  const router = useRouter();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filterId: string) => {
    if (selectedFilters.includes(filterId)) {
      setSelectedFilters(selectedFilters.filter((id) => id !== filterId));
    } else {
      setSelectedFilters([...selectedFilters, filterId]);
    }
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const applyFilters = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Bárok szűrése</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.showAllButton} onPress={clearFilters} activeOpacity={0.7}>
        <Text style={styles.showAllText}>Összes megjelenítése</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {filterCategories.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <View style={styles.filtersContainer}>
              {category.filters.map((filter) => {
                const Icon = filterIconMap[filter.id] ?? Sparkles;
                const isSelected = selectedFilters.includes(filter.id);
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.filterButton, isSelected && styles.selectedFilterButton]}
                    onPress={() => toggleFilter(filter.id)}
                    activeOpacity={0.7}
                  >
                    <Icon size={15} color={isSelected ? CYAN : "rgba(255,255,255,0.55)"} strokeWidth={1.8} />
                    <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>{filter.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.applyBar}>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters} activeOpacity={0.85}>
          <Text style={styles.applyButtonText}>Szűrők alkalmazása</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -0.6,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  showAllButton: {
    marginHorizontal: 20,
    marginBottom: 18,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
  },
  showAllText: {
    color: "rgba(255,255,255,0.62)",
    fontWeight: "600",
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.42)",
    marginBottom: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    gap: 7,
  },
  selectedFilterButton: {
    borderColor: "rgba(0, 200, 232, 0.6)",
    backgroundColor: "rgba(0, 200, 232, 0.10)",
  },
  filterText: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    fontSize: 13,
  },
  filterTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  applyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 34,
    backgroundColor: "rgba(0,0,0,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  applyButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: CYAN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: CYAN,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  applyButtonText: {
    color: "#001014",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
