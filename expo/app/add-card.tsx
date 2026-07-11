import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  Nfc,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";

const CYAN = "#00C8E8" as const;
const SERIF = Platform.select({ ios: "Georgia", default: "serif" }) as string;

type BankItem = {
  id: string;
  name: string;
  countryCode: string;
  logoColor: string;
  testMode?: boolean;
};

const BANKS: BankItem[] = [
  { id: "otp", name: "OTP Bank", countryCode: "HU", logoColor: "#006633" },
  { id: "kh", name: "K&H Bank", countryCode: "HU", logoColor: "#003B7A" },
  { id: "uni", name: "UniCredit Bank", countryCode: "HU", logoColor: "#E2001A" },
  { id: "cib", name: "CIB Bank", countryCode: "HU", logoColor: "#004A98" },
  { id: "mkb", name: "MKB Bank", countryCode: "HU", logoColor: "#0066B3" },
  { id: "erste", name: "Erste Bank", countryCode: "HU", logoColor: "#E2000A" },
  { id: "raiffeisen", name: "Raiffeisen Bank", countryCode: "HU", logoColor: "#FFE600" },
  { id: "budapest", name: "Budapest Bank", countryCode: "HU", logoColor: "#005BA9" },
  { id: "santander", name: "Santander", countryCode: "HU", logoColor: "#EC0000" },
  { id: "revolut", name: "Revolut", countryCode: "HU", logoColor: "#0075EB" },
  { id: "wise", name: "Wise", countryCode: "HU", logoColor: "#9FE870" },
  { id: "saltedge-fake", name: "Salt Edge Test Bank", countryCode: "EU", logoColor: "#1A2B4A", testMode: true },
];

type Step = "intro" | "bank" | "connecting" | "success";

export default function AddCardScreen() {
  const router = useRouter();
  const statusBarStyle = "light" as const;
  const [step, setStep] = useState<Step>("intro");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<BankItem | null>(null);

  const filteredBanks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return BANKS;
    return BANKS.filter((bank) => bank.name.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleSelectBank = useCallback((bank: BankItem) => {
    setSelectedBank(bank);
    setStep("connecting");
    // Simulate connection process (demo mode).
    setTimeout(() => {
      setStep("success");
    }, 2400);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} />
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose} testID="add-card-back">
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kártya hozzáadása</Text>
          <View style={styles.headerRight} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled
      >
        {step === "intro" && (
          <IntroStep onSelectBank={() => setStep("bank")} />
        )}

        {step === "bank" && (
          <BankSelectionStep
            banks={filteredBanks}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectBank={handleSelectBank}
          />
        )}

        {step === "connecting" && selectedBank && (
          <ConnectingStep bank={selectedBank} />
        )}

        {step === "success" && selectedBank && (
          <SuccessStep bank={selectedBank} onDone={handleClose} />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const labels = ["Bank", "Belépés", "Összekötve"];
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s, idx) => (
        <View key={s} style={styles.stepItem}>
          <View style={styles.stepColumn}>
            <View style={[styles.stepDot, s <= current && styles.stepDotActive]}>
              {s <= current ? (
                <CheckCircle2 size={14} color="#001014" />
              ) : (
                <Text style={styles.stepDotNumber}>{s}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, s <= current && styles.stepLabelActive]}>
              {labels[s - 1]}
            </Text>
          </View>
          {idx < 2 && <View style={[styles.stepConnector, s < current && styles.stepConnectorActive]} />}
        </View>
      ))}
    </View>
  );
}

function IntroStep({ onSelectBank }: { onSelectBank: () => void }) {
  return (
    <ScrollView
      style={styles.scrollBody}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroCardGlow} />
        <View style={styles.heroCardInner}>
          <CreditCard size={28} color={CYAN} />
          <Text style={styles.heroCardLabel}>COME GET IT</Text>
          <Text style={styles.heroCardSub}>Pontgyűjtő kártya</Text>
        </View>
      </View>

      <Text style={styles.introTitle}>Kapcsold össze a bankkártyád</Text>
      <Text style={styles.introSubtitle}>
        A biztonságos kapcsolat létrehozása után a pontok automatikusan gyűlnek minden
        fizetésnél a partner helyszíneken.
      </Text>

      <View style={styles.benefitList}>
        <View style={styles.benefitRow}>
          <View style={styles.benefitIcon}>
            <Shield size={16} color={CYAN} />
          </View>
          <View style={styles.benefitBody}>
            <Text style={styles.benefitTitle}>Banki szintű titkosítás</Text>
            <Text style={styles.benefitText}>
              A Salt Edge szolgáltatás PSD2/Open Banking szabvány alapján,
              titkosított csatornán.
            </Text>
          </View>
        </View>
        <View style={styles.benefitRow}>
          <View style={styles.benefitIcon}>
            <Sparkles size={16} color={CYAN} />
          </View>
          <View style={styles.benefitBody}>
            <Text style={styles.benefitTitle}>Automatikus pontgyűjtés</Text>
            <Text style={styles.benefitText}>
              Nincs szükség kódra vagy NFC-re — a pontok maguktól érkeznek.
            </Text>
          </View>
        </View>
        <View style={styles.benefitRow}>
          <View style={styles.benefitIcon}>
            <Lock size={16} color={CYAN} />
          </View>
          <View style={styles.benefitBody}>
            <Text style={styles.benefitTitle}>Te irányítod</Text>
            <Text style={styles.benefitText}>
              Bármikor leválaszthatod a kártyát a fiókod beállításaiban.
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.88} onPress={onSelectBank} testID="intro-continue">
        <LinearGradient
          colors={["#00E0FF", "#0090B8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Bank kiválasztása</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.demoNote}>
        <Text style={styles.demoNoteText}>
          Demó módban a Salt Edge Test Bankkal{"\n"}
          szimulálhatod a teljes folyamatot.
        </Text>
      </View>
    </ScrollView>
  );
}

function BankSelectionStep({
  banks,
  searchQuery,
  onSearchChange,
  onSelectBank,
}: {
  banks: BankItem[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSelectBank: (bank: BankItem) => void;
}) {
  return (
    <View style={styles.bankSelectionContainer}>
      <StepIndicator current={1} />
      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Bank keresése..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            testID="bank-search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange("")} testID="bank-search-clear">
              <X size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.bankListScroll}
        contentContainerStyle={styles.bankListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {banks.length === 0 ? (
          <Text style={styles.bankEmptyText}>Nincs találat erre: "{searchQuery}"</Text>
        ) : (
          banks.map((bank) => (
            <Pressable
              key={bank.id}
              onPress={() => onSelectBank(bank)}
              style={({ pressed }) => [
                styles.bankRow,
                pressed && styles.bankRowPressed,
              ]}
              testID={`bank-item-${bank.id}`}
            >
              <View style={[styles.bankLogo, { backgroundColor: bank.logoColor }]}>
                <Building2 size={18} color="#FFFFFF" />
              </View>
              <View style={styles.bankRowBody}>
                <Text style={styles.bankRowName}>{bank.name}</Text>
                <Text style={styles.bankRowCountry}>{bank.countryCode}</Text>
              </View>
              {bank.testMode && (
                <View style={styles.testBadge}>
                  <Text style={styles.testBadgeText}>TESZT</Text>
                </View>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ConnectingStep({ bank }: { bank: BankItem }) {
  return (
    <View style={styles.connectingContainer}>
      <StepIndicator current={2} />
      <View style={styles.connectingCard}>
        <View style={[styles.bankLogoLarge, { backgroundColor: bank.logoColor }]}>
          <Building2 size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.connectingBankName}>{bank.name}</Text>
        <Text style={styles.connectingStatus}>Biztonságos kapcsolat létrehozása…</Text>
        <ActivityIndicator size="large" color={CYAN} style={styles.connectingSpinner} />
        <View style={styles.connectingSteps}>
          <View style={styles.connectingStepRow}>
            <CheckCircle2 size={15} color={CYAN} />
            <Text style={styles.connectingStepText}>Bank kiválasztva</Text>
          </View>
          <View style={styles.connectingStepRow}>
            <ActivityIndicator size="small" color={CYAN} />
            <Text style={styles.connectingStepText}>Hitelesítés folyamatban…</Text>
          </View>
          <View style={styles.connectingStepRowPending}>
            <View style={styles.pendingDot} />
            <Text style={styles.connectingStepTextPending}>Kártya összekötése</Text>
          </View>
        </View>
        <View style={styles.secureBadge}>
          <Lock size={12} color="rgba(255,255,255,0.4)" />
          <Text style={styles.secureBadgeText}>256-bit titkosítás</Text>
        </View>
      </View>
    </View>
  );
}

function SuccessStep({ bank, onDone }: { bank: BankItem; onDone: () => void }) {
  return (
    <View style={styles.successContainer}>
      <StepIndicator current={3} />
      <View style={styles.successCard}>
        <View style={styles.successGlow} />
        <CheckCircle2 size={56} color={CYAN} style={styles.successIcon} />
        <Text style={styles.successTitle}>Kártya összekötve!</Text>
        <Text style={styles.successSubtitle}>
          A(z) {bank.name} kártyád sikeresen csatlakoztatva.{"\n"}
          Mostantól automatikusan gyűlnek a pontok{"\n"}
          minden partner helyszínen történő fizetéskor.
        </Text>
        <View style={styles.successCardPreview}>
          <View style={[styles.bankLogoSmall, { backgroundColor: bank.logoColor }]}>
            <Building2 size={14} color="#FFFFFF" />
          </View>
          <View style={styles.successCardPreviewBody}>
            <Text style={styles.successCardPreviewName}>{bank.name}</Text>
            <Text style={styles.successCardPreviewStatus}>
              <View style={styles.activeDot} /> Aktív
            </Text>
          </View>
          <Nfc size={18} color={CYAN} />
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.88} onPress={onDone} testID="success-done">
        <LinearGradient
          colors={["#00E0FF", "#0090B8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Kész</Text>
        </LinearGradient>
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
    backgroundColor: "#000000",
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  headerRight: {
    width: 40,
  },
  body: {
    flex: 1,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Intro step
  heroCard: {
    width: "100%",
    height: 160,
    borderRadius: 18,
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: "#0A0E12",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.25)",
  },
  heroCardGlow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: CYAN,
    opacity: 0.08,
  },
  heroCardInner: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 8,
  },
  heroCardLabel: {
    color: CYAN,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  heroCardSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
  introTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: SERIF,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  introSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  benefitList: {
    gap: 14,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitBody: {
    flex: 1,
  },
  benefitTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  benefitText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 18,
  },
  ctaButton: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: CYAN,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaButtonText: {
    color: "#001014",
    fontSize: 16,
    fontWeight: "900",
  },
  demoNote: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.15)",
    alignItems: "center",
  },
  demoNoteText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: "center",
  },

  // Step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepColumn: {
    alignItems: "center",
    gap: 4,
    width: 64,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: CYAN,
    borderColor: CYAN,
  },
  stepDotNumber: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "800",
  },
  stepLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "700",
  },
  stepLabelActive: {
    color: Colors.text,
  },
  stepConnector: {
    width: 28,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginTop: -14,
    marginHorizontal: -4,
  },
  stepConnectorActive: {
    backgroundColor: CYAN,
  },

  // Bank selection
  bankSelectionContainer: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  bankListScroll: {
    flex: 1,
  },
  bankListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 8,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bankRowPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
    borderColor: "rgba(0, 200, 232, 0.25)",
  },
  bankLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bankRowBody: {
    flex: 1,
  },
  bankRowName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  bankRowCountry: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  testBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(0, 200, 232, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.35)",
  },
  testBadgeText: {
    color: CYAN,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bankEmptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 30,
  },

  // Connecting step
  connectingContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  connectingCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    padding: 28,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.15)",
    alignItems: "center",
  },
  bankLogoLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  connectingBankName: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 4,
  },
  connectingStatus: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  connectingSpinner: {
    marginBottom: 20,
  },
  connectingSteps: {
    width: "100%",
    gap: 10,
    marginBottom: 20,
  },
  connectingStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  connectingStepText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  connectingStepRowPending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pendingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  connectingStepTextPending: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontWeight: "600",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secureBadgeText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "700",
  },

  // Success step
  successContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    padding: 28,
    backgroundColor: "rgba(0, 200, 232, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.25)",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  successGlow: {
    position: "absolute",
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: CYAN,
    opacity: 0.06,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "900",
    fontFamily: SERIF,
    marginBottom: 10,
  },
  successSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },
  successCardPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bankLogoSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  successCardPreviewBody: {
    flex: 1,
  },
  successCardPreviewName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  successCardPreviewStatus: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22C55E",
  },
});
