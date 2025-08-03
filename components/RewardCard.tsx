import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";
import { Reward } from "@/types/reward";

type RewardCardProps = {
  reward: Reward;
};

export default function RewardCard({ reward }: RewardCardProps) {
  return (
    <TouchableOpacity style={styles.container} testID={`reward-card-${reward.id}`}>
      <Image source={{ uri: reward.image }} style={styles.image} />
      
      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{reward.points} Points</Text>
      </View>
      
      {reward.brandLogo && (
        <View style={styles.brandContainer}>
          <Image source={{ uri: reward.brandLogo }} style={styles.brandLogo} />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.category}>{reward.category.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={2}>{reward.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 15,
  },
  image: {
    width: "100%",
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
    padding: 15,
  },
  category: {
    fontSize: 11,
    color: Colors.primary,
    marginBottom: 5,
    fontWeight: "600",
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
});