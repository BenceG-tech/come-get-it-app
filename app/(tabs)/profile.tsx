import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ChevronRight, Mail, Star, MessageCircle, CreditCard, Eye, Share } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Text style={styles.profileName}>BARÁT BARÁT</Text>
          <Text style={styles.profileEmail}>c6c8rjn8vf@privaterelay.appleid.com</Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Share size={20} color={Colors.text} />
            <Text style={styles.sectionTitle}>Megosztás</Text>
          </View>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Mail size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Barát meghívása</Text>
              <Text style={styles.menuSubtitle}>Szerezz 500 pontot, amikor meghívasz egy barátot a DUSK-ba.</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Star size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Promóciós kód megadása</Text>
              <Text style={styles.menuSubtitle}>Van egy titkos kódod vagy ajánlásod? Add meg itt az ajánlatod eléréséhez.</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Star size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Alkalmazás értékelése</Text>
              <Text style={styles.menuSubtitle}>Segíts nekünk és írj egy értékelést.</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MessageCircle size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Kövess minket</Text>
              <Text style={styles.menuSubtitle}>Szerezz 500 pontot, amikor követni kezdesz.</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={20} color={Colors.text} />
            <Text style={styles.sectionTitle}>Támogatás</Text>
          </View>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MessageCircle size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Kapcsolat</Text>
              <Text style={styles.menuSubtitle}>Olvasd el a GYIK-ot, küldj nekünk kérdéseket, vagy csak köszönj.</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiók</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <CreditCard size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Kapcsolt kártyák</Text>
              <Text style={styles.menuSubtitle}>Kapcsolj egy kártyát a jutalmak megszerzéséhez. Itt tekintheted meg a kártyáidat.</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Eye size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Személyes adatok</Text>
              <Text style={styles.menuSubtitle}>Tekintsd meg a tárolt személyes adataidat vagy töröld a fiókodat.</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Share size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Tartalom beállítások</Text>
              <Text style={styles.menuSubtitle}>Maradj kapcsolatban. Állítsd be</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
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
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: 1,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});