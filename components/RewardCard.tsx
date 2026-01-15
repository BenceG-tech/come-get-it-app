import { memo, useMemo } from "react";
import { StyleSheet, View, Text, Image, Pressable, Dimensions } from "react-native";
import { router } from "expo-router";
import {
  BadgePercent,
  Handshake,
  Martini,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { Reward } from "@/types/reward";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RewardCardProps = {
  reward: Reward;
  variant?: "grid" | "page";
  canRedeem?: boolean;
  onRedeem?: (reward: Reward) => void;
  onPress?: (reward: Reward) => void;
};

function formatDate(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}.`;
}

function RewardCardInner({ reward, variant = "grid", canRedeem, onRedeem, onPress }: RewardCardProps) {
  const containerStyle = useMemo(() => {
    return [styles.container, variant === "page" ? styles.pageContainer : undefined];
  }, [variant]);

  const imageStyle = useMemo(() => {
    return [styles.image, variant === "page" ? styles.pageImage : undefined];
  }, [variant]);

  const categoryLabel = useMemo(() => {
    const map: Record<string, string> = {
      drink: "ITAL",
      food: "ÉTEL",
      vip: "VIP",
      discount: "KEDVEZMÉNY",
      experience: "ÉLMÉNY",
      partner: "PARTNER",
    };
    const key = reward.category ?? "";
    return map[key] ?? (key ? key.toUpperCase() : "JUTALOM");
  }, [reward.category]);

  const Icon = useMemo(() => {
    const c = reward.category;
    if (c === "drink") return Martini;
    if (c === "food") return UtensilsCrossed;
    if (c === "vip") return Star;
    if (c === "discount") return BadgePercent;
    if (c === "experience") return Sparkles;
    if (c === "partner") return Handshake;
    return Sparkles;
  }, [reward.category]);

  return (
    <Pressable
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      testID={`reward-card-${reward.id}`}
      onPress={() => {
        console.log("[RewardCard] pressed", { rewardId: reward.id });
        if (onPress) {
          onPress(reward);
          return;
        }
        router.push(`/reward/${reward.id}`);
      }}
      accessibilityRole="button"
    >
      {reward.image_url ? (
        <Image source={{ uri: reward.image_url }} style={imageStyle} />
      ) : (
        <View style={[imageStyle, styles.imageFallback]} />
      )}

      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{reward.points_required} pont</Text>
      </View>

      <View style={styles.iconBadge}>
        <Icon size={16} color="#0B0F0E" />
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{categoryLabel}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {reward.name}
        </Text>
        {!!reward.partner_name && (
          <Text style={styles.partner} numberOfLines={1}>
            Partner: {reward.partner_name}
          </Text>
        )}
        <Text style={styles.expiry} numberOfLines={1}>
          Érvényes: {formatDate(reward.valid_until)}
        </Text>

        {!!onRedeem && (
          <Pressable
            testID={`reward-redeem-${reward.id}`}
            onPress={() => onRedeem(reward)}
            disabled={!canRedeem}
            style={({ pressed }) => [
              styles.redeemButton,
              !canRedeem && styles.redeemButtonDisabled,
              pressed && canRedeem && styles.redeemButtonPressed,
            ]}
          >
            <Text style={[styles.redeemText, !canRedeem && styles.redeemTextDisabled]}>
              Beváltás
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default memo(RewardCardInner);

const styles = StyleSheet.create({
  container: {
    width: 190,
    backgroundColor: "rgba(16, 24, 22, 0.92)",
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    marginRight: 0,
    borderRadius: 0,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  image: {
    width: "100%",
    height: 120,
  },
  imageFallback: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pageImage: {
    height: 300,
  },
  pointsBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  pointsText: {
    color: "#EAF7F2",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  iconBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    minHeight: 132,
  },
  category: {
    fontSize: 11,
    color: "rgba(234, 247, 242, 0.70)",
    marginBottom: 6,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#EAF7F2",
    lineHeight: 20,
  },
  partner: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(234, 247, 242, 0.65)",
    fontWeight: "600",
  },
  expiry: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(234, 247, 242, 0.55)",
    fontWeight: "600",
  },
  redeemButton: {
    marginTop: "auto",
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  redeemButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  redeemButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  redeemText: {
    color: "#0B0F0E",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  redeemTextDisabled: {
    color: "rgba(234, 247, 242, 0.55)",
  },
});