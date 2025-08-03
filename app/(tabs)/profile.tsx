import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ChevronRight, CreditCard, Eye, Share, UserPlus, Gift, Heart, HelpCircle, Settings, LogOut } from "lucide-react-native";
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
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <UserPlus size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Barát meghívása</Text>
              <Text style={styles.menuSubtitle}>Szerezz 500 pontot, amikor meghívasz egy barátot a Come Get It-ba.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Gift size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Promóciós kód megadása</Text>
              <Text style={styles.menuSubtitle}>Van egy titkos kódod vagy ajánlásod? Add meg itt az ajánlatod eléréséhez.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Heart size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Alkalmazás értékelése</Text>
              <Text style={styles.menuSubtitle}>Segíts nekünk és írj egy értékelést.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Share size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Kövess minket</Text>
              <Text style={styles.menuSubtitle}>Szerezz 500 pontot, amikor követni kezdesz.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <HelpCircle size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Kapcsolat</Text>
              <Text style={styles.menuSubtitle}>Olvasd el a GYIK-ot, küldj nekünk kérdéseket, vagy csak köszönj.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <CreditCard size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Kapcsolt kártyák</Text>
              <Text style={styles.menuSubtitle}>Kapcsolj egy kártyát a jutalmak megszerzéséhez. Itt tekintheted meg a kártyáidat.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Eye size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Személyes adatok</Text>
              <Text style={styles.menuSubtitle}>Tekintsd meg a tárolt személyes adataidat vagy töröld a fiókodat.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Settings size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Tartalom beállítások</Text>
              <Text style={styles.menuSubtitle}>Maradj kapcsolatban. Állítsd be az értesítéseidet.</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <LogOut size={18} color={"#FF6B6B"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: "#FF6B6B" }]}>Kijelentkezés</Text>
              <Text style={styles.menuSubtitle}>Jelentkezz ki a fiókodból</Text>
            </View>
            <ChevronRight size={18} color={Colors.textSecondary} />
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
    paddingTop: 70,
    paddingBottom: 30,
    alignItems: "center",
    backgroundColor: "rgba(0, 188, 212, 0.05)",
    marginBottom: 10,
  },
  profileName: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 188, 212, 0.1)",
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
    marginBottom: 3,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 17,
    opacity: 0.8,
  },
});