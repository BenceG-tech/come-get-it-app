import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { Reward } from "@/types/reward";

type RewardCardProps = {
  reward: Reward;
};

export default function RewardCard({ reward }: RewardCardProps) {
  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'drinks': 'ITALOK',
      'food': 'ÉTEL',
      'lifestyle': 'ÉLETMÓD'
    };
    return categoryMap[category] || category.toUpperCase();
  };

  const handlePress = () => {
    router.push(`/reward/${reward.id}`);
  };

  return (
    <TouchableOpacity style={styles.container} testID={`reward-card-${reward.id}`} onPress={handlePress}>
      <Image source={{ uri: reward.image }} style={styles.image} />
      
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
        <Text style={styles.title} numberOfLines={2}>{reward.title}</Text>
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
  image: {
    width: "100%",
    height: 120,
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
    padding: 12,
  },
  category: {
    fontSize: 11,
    color: Colors.primary,
    marginBottom: 5,
    fontWeight: "600",
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
  },
});