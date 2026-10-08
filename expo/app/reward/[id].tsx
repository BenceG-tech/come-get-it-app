import RemoteImage from '@/components/RemoteImage';
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Hand,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { getRewardRedemption, redeemReward } from "@/lib/rewardService";
import { useAuth } from "@/context/AuthContext";
import { fetchRewardById } from "@/lib/supabaseProvider";

const CYAN = "#00C8E8" as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });
}

function categoryMeta(category?: string): { label: string; color: string } {
  switch (category) {
    case "drink":
      return { label: "Italok", color: CYAN };
    case "food":
      return { label: "Étel", color: "#F6B17A" };
    case "vip":
      return { label: "VIP élmény", color: "#7DD3FC" };
    case "discount":
      return { label: "Kedvezmény", color: "#34D399" };
    case "experience":
      return { label: "Élmény", color: "#A78BFA" };
    case "partner":
      return { label: "Partner ajánlat", color: "#FB7185" };
    default:
      return { label: "Jutalom", color: CYAN };
  }
}

type UnlockStep = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
};

export default function RewardDetailScreen() {
  const params = useLocalSearchParams();
  const rewardId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const insets = useSafeAreaInsets();
  const { points, pointsLoaded, setPointsBalance, refreshPoints } = useAppContext();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const currentUserRef = useRef(session?.user.id);
  currentUserRef.current = session?.user.id;
  const redeemingRef = useRef(false);
  const [redeeming, setRedeeming] = useState(false);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/(rewards)/rewards");
  }, []);

  const rewardQuery = useQuery({
    queryKey: ["reward", rewardId],
    enabled: rewardId.length > 0,
    queryFn: async () => {
      console.log("[RewardDetail] Fetch reward", { rewardId });
      return fetchRewardById(rewardId);
    },
    staleTime: 30_000,
    retry: 1,
  });

  const receiptKey = ['reward-redemption', session?.user.id, rewardId];
  const receiptQuery = useQuery({
    queryKey: receiptKey,
    enabled: Boolean(rewardId && session?.user.id),
    queryFn: () => getRewardRedemption(rewardId, session!.user.id),
    staleTime: 0,
    retry: 1,
  });
  const receipt = receiptQuery.data;
  const reward = rewardQuery.data;
  const canRedeem = Boolean(reward && pointsLoaded && points >= reward.points_required);
  const missingPoints = reward ? Math.max(reward.points_required - points, 0) : 0;
  const meta = useMemo(() => categoryMeta(reward?.category), [reward?.category]);

  const handleRedeem = useCallback(async () => {
    if (!reward || redeemingRef.current || !session?.user.id) return;
    const actingUserId = session.user.id;
    if (receipt) {
      Alert.alert('Korábbi beváltás', receipt.redemption_code
        ? `${reward.name}\n\nBeváltási kód: ${receipt.redemption_code}\n\nEz a korábban kiadott kód, új pontlevonás nem történt.`
        : 'Ezt a jutalmat már beváltottad. A korábbi beváltáshoz nem tartozik megjeleníthető kód.');
      return;
    }
    if (!pointsLoaded) {
      Alert.alert("Pontegyenleg ellenőrzése", "Még nem sikerült ellenőrizni a pontjaidat. Frissítsd az egyenleget, majd próbáld újra.");
      void refreshPoints();
      return;
    }
    if (!canRedeem) {
      Alert.alert("Nincs elég pont", `Ehhez még ${missingPoints.toLocaleString("hu-HU")} pont hiányzik.`);
      return;
    }

    redeemingRef.current = true;
    setRedeeming(true);
    try {
      const result = await redeemReward(reward.id, actingUserId);
      if (currentUserRef.current !== actingUserId) return;
      setPointsBalance(result.new_balance);
      queryClient.setQueryData(['reward-redemption', session?.user.id, rewardId], result);
      void queryClient.invalidateQueries({ queryKey: ["reward", rewardId] });
      void queryClient.invalidateQueries({ queryKey: ["rewards"] });
      Alert.alert(
        result.already_redeemed ? "Korábbi beváltás" : "Sikeres beváltás",
        result.redemption_code
          ? `${result.reward_name}\n\nBeváltási kód: ${result.redemption_code}\n\n${result.already_redeemed ? 'Ez a korábban kiadott kód, új pontlevonás nem történt.' : 'Mutasd meg ezt a kódot a személyzetnek.'}`
          : 'Ezt a jutalmat már korábban beváltottad.'
      );
    } catch (error) {
      if (currentUserRef.current !== actingUserId) return;
      void refreshPoints();
      void receiptQuery.refetch();
      Alert.alert("Nem sikerült beváltani", error instanceof Error ? error.message : "Próbáld újra.");
    } finally {
      redeemingRef.current = false;
      setRedeeming(false);
    }
  }, [canRedeem, missingPoints, pointsLoaded, queryClient, refreshPoints, reward, rewardId, setPointsBalance, receipt, receiptQuery.refetch, session?.user.id]);

  const unlockSteps = useMemo<UnlockStep[]>(
    () => [
      {
        icon: Hand,
        title: "Koppints a beváltáshoz",
        subtitle: "Nyisd meg a jutalmat, amikor a partnerhelyen vagy.",
      },
      {
        icon: MapPin,
        title: "Mutasd meg",
        subtitle: "Tartsd a kijelzőt a pultosnak vagy a felszolgálónak.",
      },
      {
        icon: PartyPopper,
        title: "Élvezd",
        subtitle: "A pontok levonása után az ajánlat azonnal használható.",
      },
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

  // A receipt remains accessible even after its reward leaves the public
  // catalogue (last item claimed, disabled or expired).
  if (receipt && !reward) {
    return <View style={styles.centerContainer} testID="reward-receipt-history">
      <StatusBar style="light" />
      <TouchableOpacity onPress={handleBack} style={[styles.backButton, { top: insets.top + 12 }]} accessibilityLabel="Vissza" accessibilityRole="button">
        <ArrowLeft size={21} color={Colors.text} />
      </TouchableOpacity>
      <CheckCircle2 size={32} color={CYAN} />
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Korábbi beváltás</Text>
      <Text style={[styles.description, { marginVertical: 16 }]}>{receipt.reward_name}</Text>
      {receipt.redemption_code ? <Text selectable style={[styles.pointsValue, { fontSize: 26 }]}>{receipt.redemption_code}</Text>
        : <Text style={styles.description}>Ehhez a korábbi beváltáshoz nem tartozik megjeleníthető kód.</Text>}
      {receipt.redeemed_at && <Text style={[styles.description, { marginTop: 16 }]}>{formatDate(receipt.redeemed_at)}</Text>}
      <Text style={[styles.description, { marginTop: 16, textAlign: 'center' }]}>Ez a korábban kiadott beváltás. Megnyitásakor nem vonunk le újabb pontokat. A jutalom már nem szerepel az aktuális kínálatban.</Text>
    </View>;
  }

  if (rewardQuery.isLoading || (!reward && receiptQuery.isPending && !!session)) {
    return (
      <View style={styles.centerContainer} testID="reward-detail-loading">
        <StatusBar style="light" />
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, { top: insets.top + 12 }]}
          accessibilityRole="button"
          accessibilityLabel="Vissza"
        >
          <ArrowLeft size={21} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.loadingText}>Jutalom betöltése…</Text>
      </View>
    );
  }

  if (rewardQuery.isError || !reward) {
    return (
      <View style={styles.centerContainer} testID="reward-detail-error">
        <StatusBar style="light" />
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, { top: insets.top + 12 }]}
          accessibilityRole="button"
          accessibilityLabel="Vissza"
        >
          <ArrowLeft size={21} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Ezt a jutalmat most nem találjuk.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { void rewardQuery.refetch(); void receiptQuery.refetch(); }} testID="reward-detail-retry">
          <Text style={styles.retryBtnText}>Újrapróbálás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <TouchableOpacity
        onPress={handleBack}
        style={[styles.backButton, { top: insets.top + 12 }]}
        accessibilityRole="button"
        accessibilityLabel="Vissza"
      >
        <ArrowLeft size={21} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          {reward.image_url ? (
            <RemoteImage uri={reward.image_url} style={styles.heroImage} accessibilityLabel={reward.name} />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]} />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.66)", "#000000"]}
            locations={[0, 0.42, 0.74, 1]}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <View style={styles.partnerBadge}>
              <Sparkles size={12} color="#001014" />
              <Text style={styles.partnerBadgeText}>{reward.partner_name ?? "Come Get It"}</Text>
            </View>
            <View style={[styles.categoryChip, { borderColor: `${meta.color}55` }]}>
              <View style={[styles.categoryDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.categoryChipText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.title}>{reward.name}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.pointsRow}>
            <View>
              <Text style={styles.pointsLabel}>Pontigény</Text>
              <Text style={styles.pointsValue}>{reward.points_required.toLocaleString("hu-HU")}</Text>
            </View>
            <View style={[styles.pointsStatus, !canRedeem && styles.pointsStatusMuted]}>
              <ShieldCheck size={14} color={canRedeem ? "#001014" : "rgba(255,255,255,0.7)"} />
              <Text style={[styles.pointsStatusText, !canRedeem && styles.pointsStatusTextMuted]}>
                {receipt ? "Már beváltva" : !pointsLoaded ? "Egyenleg ellenőrzése szükséges" : canRedeem ? "Elérhető" : `${missingPoints.toLocaleString("hu-HU")} pont hiányzik`}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Mit kapsz?</Text>
            <Text style={styles.description}>{reward.description ?? "Exkluzív Come Get It partner ajánlat."}</Text>
          </View>

          <View style={styles.unlockCard}>
            <Text style={styles.unlockTitle}>Jutalom feloldása</Text>
            <View style={styles.unlockDivider} />
            {unlockSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <View key={step.title}>
                  <View style={styles.unlockStepRow}>
                    <View style={styles.unlockStepIcon}>
                      <Icon size={20} color={CYAN} strokeWidth={1.8} />
                    </View>
                    <View style={styles.unlockStepText}>
                      <Text style={styles.unlockStepTitle}>{step.title}</Text>
                      <Text style={styles.unlockStepSubtitle}>{step.subtitle}</Text>
                    </View>
                  </View>
                  {index < unlockSteps.length - 1 && <View style={styles.unlockStepLine} />}
                </View>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRowHeader}>
              <CalendarDays size={16} color={CYAN} />
              <Text style={styles.sectionTitleInline}>Érvényesség</Text>
            </View>
            <Text style={styles.description}>Felhasználható eddig: {formatDate(reward.valid_until)}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRowHeader}>
              <CheckCircle2 size={16} color={CYAN} />
              <Text style={styles.sectionTitleInline}>Feltételek</Text>
            </View>
            <Text style={styles.description}>{reward.terms_conditions ?? "A partnerhely aktuális elérhetősége és házirendje szerint használható fel."}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={[styles.redeemButton, (!canRedeem || redeeming) && styles.redeemButtonDisabled]}
          activeOpacity={0.88}
          onPress={handleRedeem}
          disabled={redeeming}
        >
          {redeeming ? <ActivityIndicator color="#001014" /> : (
            <>
              <Text style={[styles.redeemButtonText, !canRedeem && styles.redeemButtonTextDisabled]}>
                {receipt ? "Korábbi beváltás megnyitása" : !pointsLoaded ? "Pontegyenleg frissítése" : canRedeem ? "Jutalom beváltása" : `${reward.points_required.toLocaleString("hu-HU")} pont szükséges`}
              </Text>
              {canRedeem && <ArrowRight size={18} color="#001014" />}
            </>
          )}
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
    bottom: 22,
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: CYAN,
    marginBottom: 10,
  },
  partnerBadgeText: {
    color: "#001014",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.text,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 14,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(0, 200, 232, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.2)",
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  pointsValue: {
    color: CYAN,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
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
  pointsStatusMuted: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pointsStatusText: {
    color: "#001014",
    fontSize: 12,
    fontWeight: "900",
  },
  pointsStatusTextMuted: {
    color: "rgba(255,255,255,0.7)",
  },
  infoCard: {
    borderRadius: 18,
    padding: 15,
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
  sectionTitleInline: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  description: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  unlockCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(8, 28, 34, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.22)",
  },
  unlockTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  unlockDivider: {
    height: 1,
    backgroundColor: "rgba(0, 200, 232, 0.18)",
    marginBottom: 14,
  },
  unlockStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 4,
  },
  unlockStepIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  unlockStepText: {
    flex: 1,
  },
  unlockStepTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  unlockStepSubtitle: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    lineHeight: 17,
  },
  unlockStepLine: {
    marginLeft: 21,
    height: 18,
    width: 1,
    backgroundColor: "rgba(0, 200, 232, 0.22)",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  redeemButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: CYAN,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: CYAN,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10,
  },
  redeemButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowOpacity: 0,
  },
  redeemButtonText: {
    color: "#001014",
    fontSize: 16,
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
