import React, { memo, useCallback, useMemo } from "react";
import { StyleSheet, View, Text, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Apple, Chrome } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

function LandingScreen() {
  const router = useRouter();

  const goToApp = useCallback(() => {
    console.log("[Landing] Navigate to main app");
    router.replace("/(tabs)");
  }, [router]);

  const overlayOpacity = 0.5;
  const title = useMemo(() => "Come Get It", []);

  return (
    <View style={styles.root} testID="landing-root">
      <LinearGradient
        colors={["#04151A", "#000000", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={[styles.overlay, { opacity: overlayOpacity }]} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center} testID="landing-center">
          <Text style={styles.title} accessibilityRole={Platform.OS === "web" ? ("header" as const) : undefined}>
            {title}
          </Text>
          <Text style={styles.subtitle} testID="landing-subtitle">
            Jutalmak, helyek, élmények.
          </Text>
        </View>

        <View style={styles.bottom} testID="landing-actions">
          <Pressable
            testID="landing-continue-email"
            onPress={goToApp}
            style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.buttonPrimaryText}>Folytatás email címmel</Text>
          </Pressable>

          <Pressable
            testID="landing-continue-apple"
            onPress={goToApp}
            style={({ pressed }) => [styles.button, styles.buttonLight, pressed && styles.pressed]}
          >
            <View style={styles.buttonRow}>
              <Apple size={18} color="#000" />
              <Text style={styles.buttonLightText}>Bejelentkezés Apple-lel</Text>
            </View>
          </Pressable>

          <Pressable
            testID="landing-continue-google"
            onPress={goToApp}
            style={({ pressed }) => [styles.button, styles.buttonLight, pressed && styles.pressed]}
          >
            <View style={styles.buttonRow}>
              <Chrome size={18} color="#000" />
              <Text style={styles.buttonLightText}>Bejelentkezés Google-lal</Text>
            </View>
          </Pressable>

          <Text style={styles.footnote} testID="landing-footnote">
            A folytatással elfogadod a feltételeket és az adatkezelési tájékoztatót.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default memo(LandingScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
    color: Colors.text,
    fontSize: 44,
    letterSpacing: -0.8,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  bottom: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 10,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonPrimary: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonLight: {
    backgroundColor: "#FFFFFF",
  },
  buttonLightText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  footnote: {
    marginTop: 6,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});
