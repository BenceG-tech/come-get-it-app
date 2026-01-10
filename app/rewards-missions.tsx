import { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ArrowLeft, Info, Gift, Sparkles, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";


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
  // Visiting Missions
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
    title: "Craft Beer Rajongó",
    description: "Látogass meg 10 craft beer helyet!",
    points: 700,
    progress: 4,
    total: 10,
    icon: "🍻",
    isCompleted: false,
    expiryDate: "2025. 11. 30."
  },
  {
    id: "4",
    title: "Rooftop Vadász",
    description: "Látogass meg 3 különböző rooftop bart!",
    points: 500,
    progress: 1,
    total: 3,
    icon: "🏙️",
    isCompleted: false
  },
  {
    id: "5",
    title: "Wine Bar Szakértő",
    description: "Látogass meg 5 wine bart!",
    points: 550,
    progress: 0,
    total: 5,
    icon: "🍷",
    isCompleted: false
  },
  {
    id: "6",
    title: "Cocktail Bar Mester",
    description: "Látogass meg 8 cocktail bart!",
    points: 650,
    progress: 3,
    total: 8,
    icon: "🍸",
    isCompleted: false
  },
  {
    id: "7",
    title: "Pub Crawler",
    description: "Látogass meg 12 különböző pubot!",
    points: 800,
    progress: 5,
    total: 12,
    icon: "🍺",
    isCompleted: false
  },
  {
    id: "8",
    title: "Visszatérő Vendég",
    description: "Látogass meg ugyanazt a helyet 3 egymást követő héten!",
    points: 600,
    progress: 1,
    total: 3,
    icon: "🔄",
    isCompleted: false
  },
  {
    id: "9",
    title: "Éjszakai Bagoly",
    description: "Látogass meg egy helyet éjfél után!",
    points: 300,
    progress: 0,
    total: 1,
    icon: "🦉",
    isCompleted: false
  },
  {
    id: "10",
    title: "Early Bird",
    description: "Látogass meg egy helyet délelőtt 11-ig!",
    points: 300,
    progress: 0,
    total: 1,
    icon: "🌅",
    isCompleted: false
  },
  {
    id: "11",
    title: "Hétvégi Harcos",
    description: "Látogass meg 5 helyet hétvégén!",
    points: 450,
    progress: 2,
    total: 5,
    icon: "🎉",
    isCompleted: false
  },
  {
    id: "12",
    title: "Hétköznapi Felfedező",
    description: "Látogass meg 10 helyet hétköznapokon!",
    points: 600,
    progress: 6,
    total: 10,
    icon: "📅",
    isCompleted: false
  },
  
  // Drink Redeeming Missions
  {
    id: "13",
    title: "Sör Mester",
    description: "Válts be 10 ingyen sört!",
    points: 500,
    progress: 3,
    total: 10,
    icon: "🍺",
    isCompleted: false,
    expiryDate: "2025. 10. 31."
  },
  {
    id: "14",
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
    id: "15",
    title: "Wine Connoisseur",
    description: "Válts be 8 ingyen bort!",
    points: 600,
    progress: 2,
    total: 8,
    icon: "🍷",
    isCompleted: false,
    expiryDate: "2025. 12. 31."
  },
  {
    id: "16",
    title: "Shot Master",
    description: "Válts be 15 ingyen shotot!",
    points: 450,
    progress: 7,
    total: 15,
    icon: "🥃",
    isCompleted: false,
    expiryDate: "2025. 11. 15."
  },
  {
    id: "17",
    title: "Whiskey Lover",
    description: "Válts be 6 ingyen whiskyt!",
    points: 550,
    progress: 0,
    total: 6,
    icon: "🥃",
    isCompleted: false,
    expiryDate: "2025. 12. 31."
  },
  {
    id: "18",
    title: "Gin & Tonic Fan",
    description: "Válts be 7 ingyen gin tonicot!",
    points: 420,
    progress: 3,
    total: 7,
    icon: "🍸",
    isCompleted: false,
    expiryDate: "2025. 10. 31."
  },
  {
    id: "19",
    title: "Prosecco Party",
    description: "Válts be 4 ingyen proseccot!",
    points: 480,
    progress: 1,
    total: 4,
    icon: "🥂",
    isCompleted: false,
    expiryDate: "2025. 11. 30."
  },
  {
    id: "20",
    title: "Craft Beer Explorer",
    description: "Válts be 12 különböző craft sört!",
    points: 700,
    progress: 4,
    total: 12,
    icon: "🍻",
    isCompleted: false,
    expiryDate: "2025. 12. 31."
  },
  
  // Friend & Social Missions
  {
    id: "21",
    title: "Barát Meghívó",
    description: "Hívd meg egy barátodat, aki először használja a Come Get It appot!",
    points: 400,
    progress: 0,
    total: 1,
    icon: "👥",
    isCompleted: false
  },
  {
    id: "22",
    title: "Társaság Szervező",
    description: "Látogass meg 5 helyet barátokkal együtt!",
    points: 600,
    progress: 2,
    total: 5,
    icon: "👫",
    isCompleted: false
  },
  {
    id: "23",
    title: "Dupla Dátum",
    description: "Látogass meg 3 helyet párban!",
    points: 450,
    progress: 1,
    total: 3,
    icon: "💑",
    isCompleted: false
  },
  {
    id: "24",
    title: "Csapat Kapitány",
    description: "Hívj meg 3 barátot, akik mind használják az appot!",
    points: 900,
    progress: 1,
    total: 3,
    icon: "👨‍👩‍👧‍👦",
    isCompleted: false
  },
  {
    id: "25",
    title: "Születésnapi Buli",
    description: "Ünnepelj egy születésnapot 5+ fővel egy helyen!",
    points: 500,
    progress: 0,
    total: 1,
    icon: "🎂",
    isCompleted: false
  },
  {
    id: "26",
    title: "Lánybúcsú/Legénybúcsú",
    description: "Szervezz vagy vegyél részt egy búcsúbulin!",
    points: 800,
    progress: 0,
    total: 1,
    icon: "🎊",
    isCompleted: false
  },
  {
    id: "27",
    title: "Munkahelyi Csapat",
    description: "Látogass meg 3 helyet munkatársakkal!",
    points: 550,
    progress: 0,
    total: 3,
    icon: "💼",
    isCompleted: false
  },
  
  // App Usage Missions
  {
    id: "28",
    title: "App Használó - Kezdő",
    description: "Használd az appot 5 napon keresztül!",
    points: 200,
    progress: 5,
    total: 5,
    icon: "📱",
    isCompleted: true
  },
  {
    id: "29",
    title: "App Használó - Haladó",
    description: "Használd az appot 10 napon keresztül!",
    points: 400,
    progress: 8,
    total: 10,
    icon: "📱",
    isCompleted: false
  },
  {
    id: "30",
    title: "App Használó - Mester",
    description: "Használd az appot 20 napon keresztül!",
    points: 800,
    progress: 8,
    total: 20,
    icon: "📱",
    isCompleted: false
  },
  {
    id: "31",
    title: "App Használó - Legenda",
    description: "Használd az appot 30 napon keresztül!",
    points: 1200,
    progress: 8,
    total: 30,
    icon: "📱",
    isCompleted: false
  },
  {
    id: "32",
    title: "Értékelő",
    description: "Értékelj 10 helyet az appban!",
    points: 300,
    progress: 3,
    total: 10,
    icon: "⭐",
    isCompleted: false
  },
  {
    id: "33",
    title: "Fotós",
    description: "Tölts fel 15 fotót helyekről!",
    points: 450,
    progress: 6,
    total: 15,
    icon: "📸",
    isCompleted: false
  },
  {
    id: "34",
    title: "Check-in Bajnok",
    description: "Végezz 25 check-int különböző helyeken!",
    points: 750,
    progress: 12,
    total: 25,
    icon: "📍",
    isCompleted: false
  }
];

export default function RewardsMissionsScreen() {
  const router = useRouter();
  const { points } = useAppContext();
  const [bgUri, setBgUri] = useState<string>('https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/nuxl82z0l3d1zls67c787');

  const renderProgressBar = (progress: number, total: number) => {
    const percentage = (progress / total) * 100;
    const progressBarFillStyle = {
      ...styles.progressBarFill,
      width: `${percentage}%` as const,
    };
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={progressBarFillStyle} />
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
    <ImageBackground 
      source={{ uri: bgUri }}
      onError={() => setBgUri('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2060&auto=format&fit=crop')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
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
        colors={["rgba(6, 35, 47, 0.92)", "rgba(11, 45, 59, 0.88)"]}
        start={{ x: 0.12, y: 0.06 }}
        end={{ x: 1, y: 1 }}
        style={styles.rewardsCard}
        testID="rewards-missions-rewards-card"
      >
        <View style={styles.rewardsHeader}>
          <View style={styles.rewardsTitleRow}>
            <View style={styles.rewardsBadge}>
              <Gift size={14} color={"rgba(255,255,255,0.86)"} />
              <Text style={styles.rewardsBadgeText}>Rewards</Text>
            </View>
            <Text style={styles.rewardsTitle}>Come Get It</Text>
          </View>
          <View style={styles.accentDot} />
        </View>

        <View style={styles.rewardsContent}>
          <View style={styles.pointsBlock}>
            <View style={styles.pointsLabelRow}>
              <Sparkles size={14} color={"rgba(0, 209, 255, 0.95)"} />
              <Text style={styles.pointsLabel}>Elkölthető pontok</Text>
            </View>
            <Text style={styles.pointsValue} testID="rewards-missions-points">
              {points}
            </Text>
          </View>

          <View style={styles.rewardsCtaRow}>
            <View style={styles.rewardsCtaPill}>
              <Text style={styles.rewardsCtaText}>Jutalmak</Text>
              <ChevronRight size={18} color={"rgba(0,0,0,0.9)"} />
            </View>
          </View>
        </View>

        <View style={styles.shineOverlay} pointerEvents="none" />
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
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    marginBottom: 14,
    borderRadius: 18,
    padding: 18,
    position: "relative",
    overflow: "hidden",
    minHeight: 156,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#00D1FF",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  rewardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  rewardsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginRight: 10,
  },
  rewardsBadgeText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: "600",
  },
  rewardsTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  accentDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(0, 209, 255, 0.95)",
    shadowColor: "#00D1FF",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  rewardsContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  pointsBlock: {
    flex: 1,
    paddingRight: 12,
  },
  pointsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "600",
  },
  pointsValue: {
    fontSize: 44,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: -0.6,
    lineHeight: 46,
  },
  rewardsCtaRow: {
    justifyContent: "flex-end",
  },
  rewardsCtaPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 209, 255, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    minWidth: 120,
  },
  rewardsCtaText: {
    color: "rgba(0,0,0,0.92)",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 6,
  },
  shineOverlay: {
    position: "absolute",
    top: -40,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ rotate: "18deg" }],
  },
  levelProgressSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  levelProgressTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
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
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  missionsList: {
    paddingBottom: 44,
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
  backgroundImageStyle: {
    opacity: 0.65,
  },
});