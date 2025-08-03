import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
import { guides } from "@/data/guides";

export default function GuidesScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Guides</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Curated collections for every occasion</Text>
        
        {guides.map((guide) => (
          <TouchableOpacity key={guide.id} style={styles.guideCard}>
            <Image source={{ uri: guide.image }} style={styles.guideImage} />
            <View style={styles.guideOverlay}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideDescription}>{guide.description}</Text>
              <View style={styles.guideInfo}>
                <Text style={styles.guideVenues}>{guide.venueCount} venues</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>More guides coming soon</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  guideCard: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  guideImage: {
    width: "100%",
    height: "100%",
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
    justifyContent: "flex-end",
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 5,
  },
  guideDescription: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 10,
  },
  guideInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideVenues: {
    fontSize: 14,
    color: Colors.textSecondary,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  comingSoon: {
    alignItems: "center",
    marginVertical: 20,
  },
  comingSoonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});