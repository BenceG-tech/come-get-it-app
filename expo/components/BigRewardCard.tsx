import { memo, useMemo } from "react";
import { StyleSheet, View, Text, Image, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  BadgePercent,
  ChevronRight,
  Handshake,
  Martini,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react-native";
import { Reward } from "@/types/reward";

const CYAN = "#00C8E8" as const;

type BigRewardCardProps = {
  reward: Reward;
  width?: number;
  canRedeem?: boolean;
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

function BigRewardCardInner({ reward, width = 240, canRedeem, testID }: BigRewardCardProps) {
  const meta = useMemo(() => categoryMeta(reward.category), [reward.category]);
  const Icon = meta.icon;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
      testID={testID ?? `big-reward-${reward.id}`}
      onPress={() => {
        console.log("[BigRewardCard] pressed", { rewardId: reward.id });
        router.push(`/reward/${reward.id}`);
      }}
      accessibilityRole="button"
    >
      {reward.image_url ? (
        <Image source={{ uri: reward.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]}
        locations={[0, 0.4, 1]}
        style={styles.overlay}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.0)"]}
        style={styles.topOverlay}
        pointerEvents="none"
      />

      <View style={styles.topRow} pointerEvents="none">
        <View style={styles.partnerBadge}>
          <Icon size={11} color={CYAN} />
          <Text style={styles.partnerBadgeText} numberOfLines={1}>{reward.partner_name ?? "Come Get It"}</Text>
        </View>
        <View style={styles.pointsChip}>
          <Text style={styles.pointsChipText}>{reward.points_required.toLocaleString("hu-HU")} p</Text>
        </View>
      </View>

      <View style={styles.bottomContent}>
        <View style={[styles.categoryRow, { borderColor: `${meta.color}55` }]}>
          <View style={[styles.categoryDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.categoryLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{reward.name}</Text>
        {canRedeem !== undefined && (
          <View style={[styles.statusRow, canRedeem ? styles.statusOk : styles.statusPending]}>
            <Text style={[styles.statusText, canRedeem ? styles.statusTextOk : styles.statusTextPending]}>
              {canRedeem ? "Azonnal beváltható" : "Még gyűjts pontot"}
            </Text>
            <ChevronRight size={14} color={canRedeem ? CYAN : "rgba(255,255,255,0.4)"} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default memo(BigRewardCardInner);

const styles = StyleSheet.create({
  card: {
    height: 290,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 14,
    backgroundColor: "rgba(16, 24, 22, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    backgroundColor: "rgba(0, 200, 232, 0.08)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  topRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    flexShrink: 1,
  },
  partnerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  pointsChip: {
    backgroundColor: CYAN,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: CYAN,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pointsChipText: {
    color: "#001014",
    fontSize: 11,
    fontWeight: "900",
  },
  bottomContent: {
    position: "absolute",
    left: 13,
    right: 13,
    bottom: 13,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    marginBottom: 9,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  statusOk: {},
  statusPending: {},
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextOk: {
    color: CYAN,
  },
  statusTextPending: {
    color: "rgba(255,255,255,0.42)",
  },
});
