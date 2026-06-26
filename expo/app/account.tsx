import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { User, Save } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useState } from "react";

const CYAN = "#00C8E8" as const;

export default function AccountScreen() {
  const [name, setName] = useState("Bence");
  const [email, setEmail] = useState("bence@example.com");
  const [phone, setPhone] = useState("+36 30 123 4567");

  const handleSave = () => {
    console.log("Saving account details...");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Fiók", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fiókadatok</Text>
          <Text style={styles.headerSub}>Kezeld személyes adataidat és beállításaidat</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Személyes adatok</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Név</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Teljes név"
              placeholderTextColor="rgba(255,255,255,0.40)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor="rgba(255,255,255,0.40)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefonszám</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+36 30 123 4567"
              placeholderTextColor="rgba(255,255,255,0.40)"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beállítások</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow}>
              <Text style={styles.menuText}>Jelszó módosítása</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow}>
              <Text style={styles.menuText}>Értesítési beállítások</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow}>
              <Text style={styles.menuText}>Adatvédelmi beállítások</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, styles.menuRowLast]}>
              <Text style={[styles.menuText, styles.dangerText]}>Fiók törlése</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={18} color="#001014" />
          <Text style={styles.saveButtonText}>Mentés</Text>
        </TouchableOpacity>
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
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.48)",
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.68)",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  menuRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  dangerText: {
    color: "#FF6B6B",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYAN,
    borderRadius: 25,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 40,
    gap: 7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#001014",
  },
});
