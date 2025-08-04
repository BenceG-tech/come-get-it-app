import { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ArrowLeft, Info } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";

const { width } = Dimensions.get('window');

type Mission = {
  id: string;
  title: string;
  description: string;
  points: number;
  progress: number;
  total: number;
  icon: string;
  isCompleted: boolean;
  expiryDate?: string;
};

const missions: Mission[] = [
  {
    id: "1",
    title: "7 napos sorozat",
    description: "Látogass meg 7 egymást követő napon különböző vendéglátóhelyeket!",
    points: 800,
    progress: 3,
    total: 7,
    icon: "🔥",
    isCompleted: false
  },
  {
    id: "2",
    title: "Ruin Bar Felfedező",
    description: "Látogass meg 5 különböző ruin bart!",
    points: 600,
    progress: 2,
    total: 5,
    icon: "🏛️",
    isCompleted: false
  },
  {
    id: "3",
    title: "Sör Mester",
    description: "Válts be 10 ingyen sört!",
    points: 500,
    progress: 0,
    total: 10,
    icon: "🍺",
    isCompleted: false,
    expiryDate: "2025. 10. 31."
  },
  {
    id: "4",
    title: "Koktél Guru",
    description: "Válts be 5 ingyen koktélt!",
    points: 400,
    progress: 1,
    total: 5,
    icon: "🍸",
    isCompleted: false,
    expiryDate: "2025. 10. 31."
  },
  {
    id: "5",
    title: "Éjszakai Bagoly",
    description: "Látogass meg egy helyet éjfél után!",
    points: 300,
    progress: 0,
    total: 1,
    icon: "🦉",
    isCompleted: false
  },
  {
    id: "6",
    title: "Early Bird",
    description: "Látogass meg egy helyet délelőtt 11-ig!",
    points: 300,
    progress: 0,
    total: 1,
    icon: "🌅",
    isCompleted: false
  },
  {
    id: "7",
    title: "Visszatérő Vendég",
    description: "Látogass meg ugyanazt a helyet 3 egymást követő héten!",
    points: 600,
    progress: 0,
    total: 3,
    icon: "🔄",
    isCompleted: false
  },
  {
    id: "8",
    title: "Barát Meghívó",
    description: "Hívd meg egy barátodat, aki először használja a Come Get It appot!",
    points: 400,
    progress: 0,
    total: 1,
    icon: "👥",
    isCompleted: false
  },
  {
    id: "9",
    title: "App Használó",
    description: "Használd az appot 20 napon keresztül!",
    points: 1000,
    progress: 8,
    total: 20,
    icon: "📱",
    isCompleted: false
  },
  {
    id: "10",
    title: "Craft Beer Rajongó",
    description: "Látogass meg 10 craft beer helyet!",
    points: 700,
    progress: 0,
    total: 10,
    icon: "🍻",
    isCompleted: false,
    expiryDate: "2025. 11. 30."
  }
];

export default function RewardsMissionsScreen() {
  const router = useRouter();
  const { points } = useAppContext();
  const [selectedTab, setSelectedTab] = useState<'missions' | 'rewards'>('missions');

  const renderProgressBar = (progress: number, total: number) => {
    const percentage = (progress / total) * 100;
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress} / {total}</Text>
      </View>
    );
  };

  const renderMissionCard = (mission: Mission) => (
    <View key={mission.id} style={styles.missionCard}>
      <View style={styles.missionIcon}>
        <Text style={styles.missionIconText}>{mission.icon}</Text>
      </View>
      
      <View style={styles.missionContent}>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <Text style={styles.missionDescription}>{mission.description}</Text>
        
        {mission.expiryDate && (
          <View style={styles.expiryContainer}>
            <Text style={styles.expiryText}>⏰ {mission.expiryDate}-ig érvényes</Text>
          </View>
        )}
        
        {renderProgressBar(mission.progress, mission.total)}
      </View>
      
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>+{mission.points}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Come Get It Rewards</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Info size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Rewards Card */}
      <LinearGradient
        colors={['#00D1FF', '#0099CC', '#007EA7', '#005577']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rewardsCard}
      >
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>FELTÖREKVŐ</Text>
        </View>
        
        <Text style={styles.spendablePointsLabel}>Elkölthető pontok</Text>
        
        <View style={styles.pointsSection}>
          <View style={styles.pointIcon}>
            <Text style={styles.starText}>⭐</Text>
          </View>
          <Text style={styles.pointsValue}>{points}</Text>
        </View>
        
        <View style={styles.mascotContainer}>
          <Text style={styles.mascot}>🍺</Text>
        </View>
        
        {/* Gradient overlays for texture */}
        <View style={styles.textureOverlay1} />
        <View style={styles.textureOverlay2} />
        <View style={styles.gradientTexture1} />
        <View style={styles.gradientTexture2} />
      </LinearGradient>

      {/* Level Progress */}
      <View style={styles.levelProgressSection}>
        <Text style={styles.levelProgressTitle}>Előrehaladás a szinten</Text>
        
        <View style={styles.levelProgressBar}>
          <View style={styles.levelProgressFill} />
          <View style={styles.levelProgressRemaining} />
        </View>
        
        <Text style={styles.levelProgressText}>
          A szinted megtartásához gyűjts: 336 pont, eddig: 2025. 10. 31.
        </Text>
        
        <TouchableOpacity>
          <Text style={styles.howToEarnLink}>Hogyan gyűjthetek pontokat?</Text>
        </TouchableOpacity>
      </View>

      {/* Missions Section */}
      <View style={styles.missionsSection}>
        <Text style={styles.sectionTitle}>Kihívások</Text>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.missionsList}
        >
          {missions.map(renderMissionCard)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    fontStyle: "italic",
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  rewardsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 4,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    minHeight: 200,
    shadowColor: "#00D1FF",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  levelBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelBadgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  spendablePointsLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.background,
    marginTop: 50,
    marginBottom: 8,
  },
  pointsSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  starText: {
    fontSize: 20,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.background,
    lineHeight: 52,
  },
  mascotContainer: {
    position: "absolute",
    right: 20,
    top: 20,
    bottom: 20,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  mascot: {
    fontSize: 72,
  },
  textureOverlay1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    opacity: 0.4,
  },
  textureOverlay2: {
    position: "absolute",
    top: "20%",
    left: "10%",
    right: "10%",
    bottom: "20%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    opacity: 0.6,
    borderRadius: 8,
  },
  gradientTexture1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 209, 255, 0.15)",
    opacity: 0.5,
  },
  gradientTexture2: {
    position: "absolute",
    top: "30%",
    left: "20%",
    right: "20%",
    bottom: "30%",
    backgroundColor: "rgba(0, 153, 204, 0.2)",
    opacity: 0.3,
    borderRadius: 12,
  },
  levelProgressSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  levelProgressTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  levelProgressBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  levelProgressFill: {
    flex: 164,
    backgroundColor: "#FF9500",
    borderRadius: 4,
  },
  levelProgressRemaining: {
    flex: 172,
    backgroundColor: "#333333",
    borderRadius: 4,
  },
  levelProgressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  howToEarnLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
  },
  missionsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  missionsList: {
    paddingBottom: 100,
  },
  missionCard: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 4,
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.primary,
    alignItems: "flex-start",
  },
  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  missionIconText: {
    fontSize: 24,
  },
  missionContent: {
    flex: 1,
    paddingRight: 16,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  missionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  expiryContainer: {
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "500",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: "#333333",
    borderRadius: 3,
    marginRight: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#00FF00",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },
  pointsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF9500",
  },
});