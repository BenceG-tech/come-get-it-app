import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Mail, Phone, MessageCircle, ChevronRight, HelpCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function HelpScreen() {
  const handleContact = (method: string) => {
    switch (method) {
      case "email":
        Linking.openURL("mailto:support@comegetit.hu");
        break;
      case "phone":
        Linking.openURL("tel:+36301234567");
        break;
      case "chat":
        console.log("Opening chat...");
        break;
    }
  };

  const faqItems = [
    {
      id: 1,
      question: "Hogyan tudom beváltani a pontjaimat?",
      answer: "Menj a Jutalmak fülre, válassz egy jutalmot, és kattints a 'Beváltás' gombra. A pontok automatikusan levonásra kerülnek.",
    },
    {
      id: 2,
      question: "Mennyi ideig érvényesek a pontjaim?",
      answer: "A pontok 1 évig érvényesek a megszerzésük dátumától számítva.",
    },
    {
      id: 3,
      question: "Hogyan tudok barátokat meghívni?",
      answer: "Menj a Profil fülre, válaszd a 'Barátok meghívása' opciót, és oszd meg az egyedi kódodat.",
    },
    {
      id: 4,
      question: "Mikor kapok pontokat egy látogatás után?",
      answer: "A pontok automatikusan jóváírásra kerülnek a látogatás igazolása után, általában néhány percen belül.",
    },
    {
      id: 5,
      question: "Hogyan változtathatom meg a fiókadataimat?",
      answer: "Menj a Profil > Beállítások > Fiók menüpontra a fiókadatok szerkesztéséhez.",
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Segítség", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <HelpCircle size={64} color="#00D1FF" />
          </View>
          <Text style={styles.headerTitle}>Segíthetünk?</Text>
          <Text style={styles.headerDescription}>
            Válaszd ki, hogyan szeretnél kapcsolatba lépni velünk
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kapcsolatfelvétel</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContact("email")}
          >
            <View style={styles.contactIcon}>
              <Mail size={24} color="#00D1FF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactSubtitle}>support@comegetit.hu</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContact("phone")}
          >
            <View style={styles.contactIcon}>
              <Phone size={24} color="#00D1FF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Telefon</Text>
              <Text style={styles.contactSubtitle}>+36 30 123 4567</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleContact("chat")}
          >
            <View style={styles.contactIcon}>
              <MessageCircle size={24} color="#00D1FF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Chat</Text>
              <Text style={styles.contactSubtitle}>Azonnal elérhető</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gyakori kérdések</Text>
          
          {faqItems.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Nyitvatartás</Text>
          <Text style={styles.infoText}>Hétfő - Péntek: 9:00 - 18:00</Text>
          <Text style={styles.infoText}>Hétvégén: 10:00 - 16:00</Text>
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
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
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
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  faqItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});
