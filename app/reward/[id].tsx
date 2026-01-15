import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Copy, Smile } from "lucide-react-native";
import Colors from "@/constants/colors";
import { rewards } from "@/data/rewards";
import { useAppContext } from "@/context/AppContext";

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const reward = rewards.find(r => r.id === id);
  const { points } = useAppContext();

  if (!reward) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Jutalom nem található</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with back button */}
      <View style={[styles.header, styles.headerWithInsets, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {reward.image_url ? (
            <Image source={{ uri: reward.image_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: Colors.cardBackground }]} />
          )}
          <View style={styles.imageOverlay}>
            <Text style={styles.categoryText}>{(reward.category ?? "jutalom").toUpperCase()}</Text>
            <Text style={styles.discountText}>{reward.name}</Text>
          </View>
        </View>

        {/* Unlocking Reward Section */}
        <View style={styles.unlockingSection}>
          <View style={styles.unlockingHeader}>
            <Text style={styles.unlockingTitle}>✨ Jutalom feloldása</Text>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepIcon}>
              <TouchableOpacity style={styles.iconCircle}>
                <Text style={styles.iconText}>👆</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Koppints a beváltáshoz</Text>
              <Text style={styles.stepDescription}>Nyomd meg a jutalom beváltás gombot. A pontok levonásra kerülnek az egyenlegedből.</Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepIcon}>
              <TouchableOpacity style={styles.iconCircle}>
                <Copy size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Másold ki a kedvezmény kódot</Text>
              <Text style={styles.stepDescription}>A következő képernyőn másold ki a kedvezmény kódot, hogy a pénztárnál alkalmazhasd.</Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepIcon}>
              <TouchableOpacity style={styles.iconCircle}>
                <Smile size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Élvezd</Text>
              <Text style={styles.stepDescription}>Átirányítunk a kereskedő oldalára, ahol beválthatod a jutalmadat a pénztárnál. Egyszerű!</Text>
            </View>
          </View>
        </View>

        {/* Get Reward Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.getRewardButton}
            onPress={() => {
              const canRedeem = points >= reward.points_required;
              console.log("[RewardDetail] redeem pressed", { rewardId: reward.id, canRedeem, points });
              if (!canRedeem) {
                Alert.alert("Nincs elég pont", `Ehhez a jutalomhoz ${reward.points_required} pontra van szükséged.`);
                return;
              }
              Alert.alert("Beváltás", "A beváltás (redeem-reward) endpointot a következő lépésben kötjük be.");
            }}
          >
            <Text style={styles.getRewardButtonText}>
              {points >= reward.points_required ? "Beváltás" : `Beváltás (${reward.points_required} pont)`}
            </Text>
            <ArrowLeft size={20} color={Colors.text} style={styles.arrowIcon} />
          </TouchableOpacity>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
  },
  categoryText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    letterSpacing: 1,
  },
  discountText: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "bold",
  },
  unlockingSection: {
    padding: 20,
  },
  unlockingHeader: {
    marginBottom: 20,
  },
  unlockingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 25,
    alignItems: "flex-start",
  },
  stepIcon: {
    marginRight: 15,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
    paddingTop: 5,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  getRewardButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
  },
  getRewardButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: Colors.text,
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  headerWithInsets: {
    // Dynamic padding handled inline
  },
  arrowIcon: {
    transform: [{ rotate: '180deg' }],
  },
});