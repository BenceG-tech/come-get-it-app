import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Copy, Share2, MessageCircle, Mail } from "lucide-react-native";
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
      <Stack.Screen options={{ title: "Barátok meghívása", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#00D1FF', '#0099CC', '#007EA7', '#005577']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroEmoji}>🎁</Text>
            <Text style={styles.heroTitle}>Hívd meg barátaidat!</Text>
            <Text style={styles.heroDescription}>
              Mindketten kaptok 100 pontot, amikor barátod elkészíti első rendelését
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A te kódod</Text>
          
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Ajánlói kód</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeValue}>{referralCode}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopy}
              >
                {copied ? (
                  <Text style={styles.copyButtonText}>✓ Másolva</Text>
                ) : (
                  <>
                    <Copy size={16} color="#00D1FF" />
                    <Text style={styles.copyButtonText}>Másolás</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.shareOptions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <View style={styles.shareIcon}>
                <Share2 size={24} color="#00D1FF" />
              </View>
              <Text style={styles.shareText}>Megosztás</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton}>
              <View style={styles.shareIcon}>
                <MessageCircle size={24} color="#00D1FF" />
              </View>
              <Text style={styles.shareText}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton}>
              <View style={styles.shareIcon}>
                <Mail size={24} color="#00D1FF" />
              </View>
              <Text style={styles.shareText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hogyan működik?</Text>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Oszd meg a kódodat</Text>
              <Text style={styles.stepDescription}>
                Küld el a kódodat barátaidnak bármilyen módon
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
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

          <View style={styles.stepCard}>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 4,
    padding: 32,
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.background,
    marginBottom: 12,
    textAlign: "center",
  },
  heroDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  codeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#00D1FF",
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  copyButtonText: {
    fontSize: 14,
    color: "#00D1FF",
    fontWeight: "600",
  },
  shareOptions: {
    flexDirection: "row",
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  shareText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "600",
  },
  stepCard: {
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00D1FF",
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
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 20,
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
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    marginHorizontal: 12,
  },
});
