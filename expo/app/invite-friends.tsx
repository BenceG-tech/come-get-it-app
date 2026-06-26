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
            colors={["rgba(6, 35, 47, 0.88)", "rgba(10, 56, 68, 0.76)"]}
            start={{ x: 0.12, y: 0.06 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIconWrap}>
              <Gift size={28} color="rgba(0, 200, 232, 0.96)" />
            </View>
            <Text style={styles.heroTitle}>Hívd meg barátaidat!</Text>
            <Text style={styles.heroDescription}>
              Mindketten kaptok 100 pontot, amikor barátod elkészíti első rendelését
            </Text>
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
                  <Text style={styles.copyButtonText}>Másolva</Text>
                ) : (
                  <>
                    <Copy size={14} color="rgba(0, 200, 232, 0.94)" />
                    <Text style={styles.copyButtonText}>Másolás</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.shareOptions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} testID="share-referral" activeOpacity={0.9}>
              <View style={styles.shareIcon}>
                <Share2 size={18} color="rgba(0, 200, 232, 0.94)" />
              </View>
              <Text style={styles.shareText}>Megosztás</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.40)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} testID="share-sms" activeOpacity={0.9}>
              <View style={styles.shareIcon}>
                <MessageCircle size={18} color="rgba(0, 200, 232, 0.94)" />
              </View>
              <Text style={styles.shareText}>SMS</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.40)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} testID="share-email" activeOpacity={0.9}>
              <View style={styles.shareIcon}>
                <Mail size={18} color="rgba(0, 200, 232, 0.94)" />
              </View>
              <Text style={styles.shareText}>Email</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.40)" />
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
    paddingTop: 12,
    paddingBottom: 12,
  },
  heroCard: {
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.14)",
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.68)",
    lineHeight: 18,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  codeCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  codeLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.62)",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#00C8E8",
    letterSpacing: 1.5,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 200, 232, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.20)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  copyButtonText: {
    fontSize: 12,
    color: "rgba(0, 200, 232, 0.94)",
    fontWeight: "800",
  },
  shareOptions: {
    flexDirection: "column",
    gap: 8,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  shareIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  shareText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: "800",
  },
  stepCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#00C8E8",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.46)",
    lineHeight: 17,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00C8E8",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.44)",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 10,
  },
});
