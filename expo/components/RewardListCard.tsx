import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  BadgePercent,
  CalendarClock,
  Handshake,
  Martini,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";
import type { Reward } from "@/types/reward";

const CYAN = "#00C8E8" as const;

type RewardListCardProps = {
  reward: Reward;
  points: number;
  testID?: string;
};

function categoryMeta(category?: string): { label: string; color: string; icon: LucideIcon } {
  switch (category) {
    case "drink":
      return { label: "Italok", color: CYAN, icon: Martini };
    case "food":
      return { label: "Étel", color: "#F6B17A", icon: UtensilsCrossed };
    case "vip":
      return { label: "VIP", color: "#7DD3FC", icon: Star };
    case "discount":
      return { label: "Kedvezmény", color: "#34D399", icon: BadgePercent };
    case "experience":
      return { label: "Élmények", color: "#A78BFA", icon: Sparkles };
    case "partner":
      return { label: "Partner", color: "#FB7185", icon: Handshake };
    default:
      return { label: "Jutalom", color: CYAN, icon: Sparkles };
  }
}

function formatValidUntil(validUntil: string): string | null {
  const d = new Date(validUntil);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}.`;
}

export default function RewardListCard({ reward, points, testID }: RewardListCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width: screenWidth } = useWindowDimensions();
  const meta = categoryMeta(reward.category);
  const Icon = meta.icon;
  const canRedeem = points >= reward.points_required;
  const missing = Math.max(reward.points_required - points, 0);
  const validText = formatValidUntil(reward.valid_until);

  const placeholderUri = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600";
  const imageSource = reward.image_url ? { uri: reward.image_url } : { uri: placeholderUri };

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          console.log("[RewardListCard] pressed", { rewardId: reward.id });
          router.push(`/reward/${reward.id}`);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${reward.name} jutalom`}
        testID={testID ?? `reward-list-card-${reward.id}`}
      >
        <View style={[styles.imageContainer, { height: Math.round(screenWidth * 0.42) }]}>
          <View style={styles.imageClip}>
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.45)"]} style={styles.imageGradient} />
          </View>

          <View style={[styles.categoryPill, { borderColor: `${meta.color}88` }]}>
            <Icon size={12} color={meta.color} />
            <Text style={[styles.categoryPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>

          <View style={styles.pointsPill}>
            <Sparkles size={12} color={CYAN} />
            <Text style={styles.pointsPillText}>{reward.points_required.toLocaleString("hu-HU")} pont</Text>
          </View>

          <View style={[styles.statusBadge, canRedeem ? styles.statusBadgeOk : styles.statusBadgePending]}>
            <Text style={[styles.statusText, !canRedeem && styles.statusTextPending]}>
              {canRedeem ? "Beváltható" : `Még ${missing.toLocaleString("hu-HU")} pont`}
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.rewardName} numberOfLines={1}>{reward.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.partnerText} numberOfLines={1}>
              {reward.partner_name ?? "Come Get It"}
            </Text>
            {validText ? (
              <View style={styles.validRow}>
                <CalendarClock size={11} color="rgba(255,255,255,0.42)" />
                <Text style={styles.validText}>{validText}-ig</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0E0E10",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: {
    width: "100%",
    position: "relative" as const,
  },
  imageClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden" as const,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  categoryPill: {
    position: "absolute" as const,
    top: 10,
    left: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
  pointsPill: {
    position: "absolute" as const,
    top: 10,
    right: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.5)",
  },
  pointsPillText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  statusBadge: {
    position: "absolute" as const,
    bottom: -14,
    right: 14,
    zIndex: 2,
    backgroundColor: "#000000",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  statusBadgeOk: {
    borderColor: "rgba(0, 200, 232, 0.95)",
    shadowColor: CYAN,
  },
  statusBadgePending: {
    borderColor: "rgba(255, 255, 255, 0.55)",
    shadowColor: "#FFFFFF",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: CYAN,
  },
  statusTextPending: {
    color: "rgba(255,255,255,0.86)",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 10,
  },
  partnerText: {
    flex: 1,
    fontSize: 12,
    color: "#A6A6AD",
    fontWeight: "600" as const,
  },
  validRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  validText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.42)",
    fontWeight: "600" as const,
  },
});
