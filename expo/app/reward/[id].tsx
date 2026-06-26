import { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, ShieldCheck, Sparkles } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { rest } from "@/lib/supabaseRest";
import type { Reward } from "@/types/reward";
import { getMockRewardById } from "@/data/mockRewards";

const CYAN = "#00C8E8" as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });
}

function getCategoryLabel(category?: string): string {
  const labels: Record<string, string> = {
    drink: "Ital ajánlat",
    food: "Gasztro jutalom",
    vip: "VIP élmény",
    discount: "Kedvezmény",
    experience: "Élmény",
    partner: "Partner ajánlat",
  };
  return labels[category ?? ""] ?? "Jutalom";
}

export default function RewardDetailScreen() {
  const params = useLocalSearchParams();
  const rewardId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const insets = useSafeAreaInsets();
  const { points } = useAppContext();

  const rewardQuery = useQuery({
    queryKey: ["reward", rewardId],
    enabled: rewardId.length > 0,
    queryFn: async () => {
      const mockReward = getMockRewardById(rewardId);
      if (mockReward) return mockReward;

      console.log("[RewardDetail] Fetch reward", { rewardId });
      const res = await rest(`/rewards?id=eq.${encodeURIComponent(rewardId)}&select=*`);
      const json = (await res.json()) as unknown;
      const rows = Array.isArray(json) ? (json as Reward[]) : [];
      return rows[0] ?? null;
    },
    staleTime: 30_000,
    retry: 1,
  });

  const reward = rewardQuery.data;
  const canRedeem = Boolean(reward && points >= reward.points_required);
  const missingPoints = reward ? Math.max(reward.points_required - points, 0) : 0;

  const steps = useMemo(
    () => [
      "Nyomd meg a beváltás gombot, amikor a partnerhelyen vagy.",
      "Mutasd meg a képernyőt a pultnál vagy a felszolgálónak.",
      "A pontok levonása után az ajánlat azonnal felhasználható.",
    ],
    []
  );

  if (!rewardId) {
    return (
      <View style={styles.centerContainer} testID="reward-detail-missing-id">
        <Text style={styles.errorText}>Hiányzó jutalom azonosító</Text>
      </View>
    );
  }

  if (rewardQuery.isLoading) {
    return (
      <View style={styles.centerContainer} testID="reward-detail-loading">
        <Text style={styles.loadingText}>Jutalom betöltése…</Text>
      </View>
    );
  }

  if (rewardQuery.isError || !reward) {
    return (
      <View style={styles.centerContainer} testID="reward-detail-error">
        <Text style={styles.errorText}>Ezt a jutalmat most nem találjuk.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => rewardQuery.refetch()} testID="reward-detail-retry">
          <Text style={styles.retryBtnText}>Újrapróbálás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 12 }]}
        accessibilityRole="button"
        accessibilityLabel="Vissza"
      >
        <ArrowLeft size={21} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          {reward.image_url ? (
            <Image source={{ uri: reward.image_url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]} />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.04)", "rgba(0,0,0,0.28)", "#000000"]}
            locations={[0, 0.45, 1]}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <View style={styles.categoryPill}>
              <Sparkles size={13} color={CYAN} />
              <Text style={styles.categoryPillText}>{getCategoryLabel(reward.category)}</Text>
            </View>
            <Text style={styles.title}>{reward.name}</Text>
            <View style={styles.partnerRow}>
              <MapPin size={14} color="rgba(255,255,255,0.68)" />
              <Text style={styles.partnerText}>{reward.partner_name ?? "Come Get It partner"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <LinearGradient
            colors={["rgba(0, 200, 232, 0.16)", "rgba(29, 109, 255, 0.08)", "rgba(255,255,255,0.035)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointsCard}
          >
            <View>
              <Text style={styles.pointsLabel}>Pontigény</Text>
              <Text style={styles.pointsValue}>{reward.points_required.toLocaleString("hu-HU")}</Text>
            </View>
            <View style={styles.pointsStatus}>
              <ShieldCheck size={15} color={canRedeem ? "#001014" : "rgba(255,255,255,0.72)"} />
              <Text style={[styles.pointsStatusText, !canRedeem && styles.pointsStatusTextMuted]}>
                {canRedeem ? "Elérhető" : `${missingPoints.toLocaleString("hu-HU")} pont hiányzik`}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Mit kapsz?</Text>
            <Text style={styles.description}>{reward.description ?? "Exkluzív Come Get It partner ajánlat."}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRowHeader}>
              <CalendarDays size={17} color={CYAN} />
              <Text style={styles.sectionTitle}>Érvényesség</Text>
            </View>
            <Text style={styles.description}>Felhasználható eddig: {formatDate(reward.valid_until)}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Beváltás menete</Text>
            {steps.map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRowHeader}>
              <CheckCircle2 size={17} color={CYAN} />
              <Text style={styles.sectionTitle}>Feltételek</Text>
            </View>
            <Text style={styles.description}>{reward.terms_conditions ?? "A partnerhely aktuális elérhetősége és házirendje szerint használható fel."}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}> 
        <TouchableOpacity
          style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
          activeOpacity={0.88}
          onPress={() => {
            console.log("[RewardDetail] redeem pressed", { rewardId: reward.id, canRedeem, points });
            if (!canRedeem) {
              Alert.alert("Nincs elég pont", `Ehhez még ${missingPoints.toLocaleString("hu-HU")} pont hiányzik.`);
              return;
            }
            Alert.alert("Beváltás előkészítve", "Mutasd meg ezt az ajánlatot a partnerhelyen, és a személyzet aktiválja.");
          }}
        >
          <Text style={[styles.redeemButtonText, !canRedeem && styles.redeemButtonTextDisabled]}>
            {canRedeem ? "Jutalom beváltása" : `${reward.points_required.toLocaleString("hu-HU")} pont szükséges`}
          </Text>
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
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 118,
  },
  backButton: {
    position: "absolute",
    left: 14,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    height: 390,
    backgroundColor: "#050709",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    backgroundColor: "rgba(0, 200, 232, 0.10)",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 24,
  },
  categoryPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.28)",
    marginBottom: 12,
  },
  categoryPillText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.text,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  partnerText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  pointsCard: {
    borderRadius: 22,
    padding: 17,
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pointsValue: {
    color: CYAN,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 2,
  },
  pointsStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: CYAN,
  },
  pointsStatusText: {
    color: "#001014",
    fontSize: 12,
    fontWeight: "900",
  },
  pointsStatusTextMuted: {
    color: "rgba(255,255,255,0.72)",
  },
  infoCard: {
    borderRadius: 19,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  infoRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  description: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginTop: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: CYAN,
    fontSize: 12,
    fontWeight: "900",
  },
  stepText: {
    flex: 1,
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.90)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  redeemButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: CYAN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: CYAN,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    shadowOpacity: 0,
  },
  redeemButtonText: {
    color: "#001014",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  redeemButtonTextDisabled: {
    color: "rgba(255,255,255,0.62)",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "700",
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYAN,
  },
  retryBtnText: {
    color: "#001014",
    fontSize: 14,
    fontWeight: "900",
  },
  errorText: {
    color: Colors.text,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
  },
});
