import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Copy, Share2, MessageCircle, Mail, Gift, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

export default function InviteFriendsScreen() {
  const [copied, setCopied] = useState(false);
  const referralCode = "BENCE2024";

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Csatlakozz hozzám a Come Get It-en és szerezz ingyenes italokat! Használd a kódomat: ${referralCode}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Barátok meghívása", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text, headerShadowVisible: false }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient
            colors={["rgba(6, 35, 47, 0.94)", "rgba(10, 56, 68, 0.86)"]}
            start={{ x: 0.12, y: 0.06 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIconWrap}>
              <Gift size={36} color={"rgba(0, 209, 255, 0.98)"} />
            </View>
            <Text style={styles.heroTitle}>Hívd meg barátaidat!</Text>
            <Text style={styles.heroDescription}>
              Mindketten kaptok 100 pontot, amikor barátod elkészíti első rendelését
            </Text>
            <View style={styles.heroGlow} pointerEvents="none" />
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A te kódod</Text>
          
          <View style={styles.codeCard} testID="referral-code-card">
            <Text style={styles.codeLabel}>Ajánlói kód</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeValue} testID="referral-code">{referralCode}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopy}
                testID="copy-referral-code"
                activeOpacity={0.9}
              >
                {copied ? (
                  <Text style={styles.copyButtonText}>✓ Másolva</Text>
                ) : (
                  <>
                    <Copy size={16} color={"rgba(0, 209, 255, 0.95)"} />
                    <Text style={styles.copyButtonText}>Másolás</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.shareOptions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} testID="share-referral" activeOpacity={0.9}>
              <View style={styles.shareIcon}>
                <Share2 size={20} color={"rgba(0, 209, 255, 0.95)"} />
              </View>
              <Text style={styles.shareText}>Megosztás</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} testID="share-sms" activeOpacity={0.9}>
              <View style={styles.shareIcon}>
                <MessageCircle size={20} color={"rgba(0, 209, 255, 0.95)"} />
              </View>
              <Text style={styles.shareText}>SMS</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} testID="share-email" activeOpacity={0.9}>
              <View style={styles.shareIcon}>
                <Mail size={20} color={"rgba(0, 209, 255, 0.95)"} />
              </View>
              <Text style={styles.shareText}>Email</Text>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hogyan működik?</Text>
          
          <View style={styles.stepCard} testID="invite-step-1">
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Oszd meg a kódodat</Text>
              <Text style={styles.stepDescription}>
                Küldd el a kódodat barátaidnak bármilyen módon
              </Text>
            </View>
          </View>

          <View style={styles.stepCard} testID="invite-step-2">
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Barátod regisztrál</Text>
              <Text style={styles.stepDescription}>
                Beírja a te kódodat regisztráció során
              </Text>
            </View>
          </View>

          <View style={styles.stepCard} testID="invite-step-3">
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Mindketten nyertek!</Text>
              <Text style={styles.stepDescription}>
                100-100 pont az első rendelés után
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meghívott barátok</Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Meghívva</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Aktív</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>800</Text>
              <Text style={styles.statLabel}>Pontok</Text>
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  heroCard: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "flex-start",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.16)",
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(0, 209, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.74)",
    lineHeight: 20,
    fontWeight: "600",
  },
  heroGlow: {
    position: "absolute",
    top: -90,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 209, 255, 0.12)",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  codeCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  codeLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.68)",
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeValue: {
    fontSize: 30,
    fontWeight: "900",
    color: "rgba(0, 209, 255, 0.98)",
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 209, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.22)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  copyButtonText: {
    fontSize: 14,
    color: "rgba(0, 209, 255, 0.95)",
    fontWeight: "800",
  },
  shareOptions: {
    flexDirection: "column",
    gap: 10,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  shareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 209, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shareText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: "800",
  },
  stepCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 209, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 209, 255, 0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(0, 209, 255, 0.95)",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#00D1FF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 12,
  },
});
