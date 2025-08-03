import { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { filterCategories } from "@/data/filters";

export default function FilterScreen() {
  const router = useRouter();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filterId: string) => {
    if (selectedFilters.includes(filterId)) {
      setSelectedFilters(selectedFilters.filter(id => id !== filterId));
    } else {
      setSelectedFilters([...selectedFilters, filterId]);
    }
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const applyFilters = () => {
    // In a real app, we would pass these filters to a context or query params
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Filter bars</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.showAllButton} onPress={clearFilters}>
        <Text style={styles.showAllText}>Show all</Text>
      </TouchableOpacity>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {filterCategories.map(category => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <View style={styles.filtersContainer}>
              {category.filters.map(filter => (
                <TouchableOpacity 
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    selectedFilters.includes(filter.id) && styles.selectedFilterButton,
                    { backgroundColor: filter.color }
                  ]}
                  onPress={() => toggleFilter(filter.id)}
                >
                  {filter.icon && (
                    <Text style={styles.filterIcon}>{filter.icon}</Text>
                  )}
                  <Text style={styles.filterText}>{filter.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
        <Text style={styles.applyButtonText}>Apply Filters</Text>
      </TouchableOpacity>
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  closeButton: {
    padding: 5,
  },
  showAllButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "flex-start",
  },
  showAllText: {
    color: Colors.text,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#333",
    gap: 5,
  },
  selectedFilterButton: {
    borderWidth: 1,
    borderColor: Colors.text,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    color: Colors.text,
    fontWeight: "500",
  },
  applyButton: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: Colors.text,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  applyButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
});