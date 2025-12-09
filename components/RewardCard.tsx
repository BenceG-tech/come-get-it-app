import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { Reward } from "@/types/reward";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RewardCardProps = {
  reward: Reward;
  variant?: "grid" | "page" | "list";
};

export default function RewardCard({ reward, variant = "grid" }: RewardCardProps) {
  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      drinks: "ITALOK",
      food: "ÉTEL",
      lifestyle: "ÉLETMÓD",
    };
    return categoryMap[category] || category.toUpperCase();
  };

  const handlePress = () => {
    router.push(`/reward/${reward.id}`);
  };

  const containerStyle = [
    styles.container,
    variant === "page" ? styles.pageContainer : undefined,
    variant === "list" ? styles.listContainer : undefined,
  ];
  const imageStyle = [
    styles.image,
    variant === "page" ? styles.pageImage : undefined,
    variant === "list" ? styles.listImage : undefined,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      testID={`reward-card-${reward.id}`}
      onPress={handlePress}
      accessibilityRole="button"
    >
      <Image source={{ uri: reward.image }} style={imageStyle} />

      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{reward.points} Pont</Text>
      </View>

      {reward.brandLogo && (
        <View style={styles.brandContainer}>
          <Image source={{ uri: reward.brandLogo }} style={styles.brandLogo} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.category}>{getCategoryName(reward.category)}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {reward.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 15,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    marginRight: 0,
    borderRadius: 0,
  },
  image: {
    width: "100%",
    height: 120,
  },
  pageImage: {
    height: 300,
  },
  listContainer: {
    width: "100%",
    marginRight: 0,
    marginBottom: 15,
    borderRadius: 12,
  },
  listImage: {
    height: 150,
  },
  pointsBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  pointsText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 11,
  },
  brandContainer: {
    position: "absolute",
    bottom: 70,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  brandLogo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  content: {
    padding: 16,
  },
  category: {
    fontSize: 11,
    color: Colors.primary,
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
});