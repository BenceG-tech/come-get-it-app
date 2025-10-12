import { useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Lock } from "lucide-react-native";
import Colors from "@/constants/colors";
import { rewards } from "@/data/rewards";
import RewardCard from "@/components/RewardCard";

export default function RewardsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredEditorPicks = useMemo(() => {
    return selectedCategory ? rewards.filter(r => r.category === selectedCategory) : rewards.slice(0, 3);
  }, [selectedCategory]);

  const handleSelect = (cat: string | null) => {
    console.log("[Rewards] Category pressed:", cat);
    setSelectedCategory(cat);
  };

  return (
    <View style={styles.container} testID="rewards-screen">
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Jutalmak</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>8 700 POINTS</Text>
        </View>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} accessibilityRole="scrollbar">
        <View style={styles.cardSection}>
          <View style={styles.addCardContainer}>
            <Image 
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/6772/6772415.png" }} 
              style={styles.cardIcon} 
              accessibilityIgnoresInvertColors
            />
            <View style={styles.addCardTextContainer}>
              <Text style={styles.addCardTitle}>ADJ HOZZÁ EGY KÁRTYÁT, HOGY JUTALOM PONTOKAT SZEREZZ MINDEN ALKALOMMAL, AMIKOR A BÁRJAINKBAN KÖLTESZ</Text>
              <Text style={styles.addCardSubtitle}>Biztonságos és <Text style={styles.bold}>soha nem terhelünk meg</Text>.</Text>
            </View>
            <TouchableOpacity style={styles.addCardButton} accessibilityRole="button" testID="add-card-button">
              <Lock size={16} color={Colors.text} />
              <Text style={styles.addCardButtonText}>Kártya hozzáadása</Text>
            </TouchableOpacity>
            <View style={styles.cardBrands}>
              <Image 
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png" }} 
                style={styles.cardBrand} 
              />
              <Image 
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" }} 
                style={styles.cardBrand} 
              />
              <Image 
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" }} 
                style={styles.cardBrand} 
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>♥ Szerkesztők választása</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {filteredEditorPicks.map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </ScrollView>
        </View>
        
        <TouchableOpacity style={styles.referButton} testID="refer-friend">
          <Image 
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/3682/3682321.png" }} 
            style={styles.referIcon} 
          />
          <View style={styles.referTextContainer}>
            <Text style={styles.referTitle}>Hívj meg egy barátot</Text>
            <Text style={styles.referSubtitle}>Szerezz 500 pontot, amikor meghívsz egy barátot a Come Get It-re.</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Kategóriák</Text>
            {selectedCategory !== null && (
              <Text style={styles.sectionSubtitle} testID="selected-category">Szűrő: {selectedCategory}</Text>
            )}
          </View>
          
          <View style={styles.categoriesGrid}>
            <TouchableOpacity 
              style={[styles.categoryCard, selectedCategory === 'drinks' ? styles.categoryCardActive : undefined]}
              onPress={() => handleSelect('drinks')}
              accessibilityRole="button"
              accessibilityLabel="Italok kategória"
              testID="cat-drinks"
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1470&q=80" }} 
                style={styles.categoryImage} 
              />
              <View style={styles.categoryOverlay} pointerEvents="none">
                <Text style={styles.categoryTitle}>Italok</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryCard, selectedCategory === 'food' ? styles.categoryCardActive : undefined]}
              onPress={() => handleSelect('food')}
              accessibilityRole="button"
              accessibilityLabel="Étel kategória"
              testID="cat-food"
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1470&q=80" }} 
                style={styles.categoryImage} 
              />
              <View style={styles.categoryOverlay} pointerEvents="none">
                <Text style={styles.categoryTitle}>Étel</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryCard, selectedCategory === 'lifestyle' ? styles.categoryCardActive : undefined]}
              onPress={() => handleSelect('lifestyle')}
              accessibilityRole="button"
              accessibilityLabel="Életmód kategória"
              testID="cat-lifestyle"
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1548&q=80" }} 
                style={styles.categoryImage} 
              />
              <View style={styles.categoryOverlay} pointerEvents="none">
                <Text style={styles.categoryTitle}>Életmód</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryCard, selectedCategory === null ? styles.categoryCardActive : undefined]}
              onPress={() => handleSelect(null)}
              accessibilityRole="button"
              accessibilityLabel="Összes megtekintése"
              testID="cat-all"
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1548&q=80" }} 
                style={styles.categoryImage} 
              />
              <View style={styles.categoryOverlay} pointerEvents="none">
                <Text style={styles.categoryTitle}>Összes megtekintése</Text>
              </View>
            </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  pointsContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
  pointsLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  cardSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  addCardContainer: {
    backgroundColor: Colors.text,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cardIcon: {
    width: 40,
    height: 24,
    resizeMode: "contain",
    marginBottom: 12,
  },
  addCardTextContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.background,
    textAlign: "center",
    marginBottom: 8,
  },
  addCardSubtitle: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
  addCardButton: {
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "100%",
    marginBottom: 16,
    gap: 8,
  },
  addCardButtonText: {
    color: Colors.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  cardBrands: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
  },
  cardBrand: {
    width: 40,
    height: 24,
    resizeMode: "contain",
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 5,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  referButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 12,
  },
  referIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  referTextContainer: {
    flex: 1,
  },
  referTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  referSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  rewardsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryCard: {
    width: "47%",
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  categoryCardActive: {
    borderColor: Colors.text,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
});