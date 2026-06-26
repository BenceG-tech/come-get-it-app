import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Mail, Phone, MessageCircle, HelpCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

const CYAN = "#00C8E8" as const;

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
          <Text style={styles.headerTitle}>Segíthetünk?</Text>
          <Text style={styles.headerDescription}>
            Válaszd ki, hogyan szeretnél kapcsolatba lépni velünk
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kapcsolatfelvétel</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.contactRow} onPress={() => handleContact("email")}>
              <View style={styles.contactIcon}>
                <Mail size={18} color={CYAN} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email</Text>
                <Text style={styles.contactSubtitle}>support@comegetit.hu</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={() => handleContact("phone")}>
              <View style={styles.contactIcon}>
                <Phone size={18} color={CYAN} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Telefon</Text>
                <Text style={styles.contactSubtitle}>+36 30 123 4567</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactRow, styles.contactRowLast]} onPress={() => handleContact("chat")}>
              <View style={styles.contactIcon}>
                <MessageCircle size={18} color={CYAN} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Chat</Text>
                <Text style={styles.contactSubtitle}>Azonnal elérhető</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gyakori kérdések</Text>
          
          {faqItems.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <View style={styles.faqDot} />
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <HelpCircle size={18} color={CYAN} />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>Nyitvatartás</Text>
            <Text style={styles.infoText}>Hétfő - Péntek: 9:00 - 18:00</Text>
            <Text style={styles.infoText}>Hétvégén: 10:00 - 16:00</Text>
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.48)",
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  contactRowLast: {
    borderBottomWidth: 0,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0, 200, 232, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 232, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.46)",
  },
  faqItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  faqDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CYAN,
    marginTop: 6,
    marginRight: 12,
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: "rgba(255,255,255,0.50)",
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 40,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  infoTextBlock: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.48)",
    marginBottom: 2,
  },
});
