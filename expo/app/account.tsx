import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { User, Save } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useState } from "react";

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
          <View style={styles.avatarContainer}>
            <User size={48} color="#00D1FF" />
          </View>
          <Text style={styles.headerTitle}>Fiókadatok</Text>
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
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={Colors.textSecondary}
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
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beállítások</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuTitle}>Jelszó módosítása</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuTitle}>Értesítési beállítások</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuTitle}>Adatvédelmi beállítások</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={[styles.menuTitle, styles.dangerText]}>Fiók törlése</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color={Colors.background} />
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
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 209, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  menuItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  dangerText: {
    color: "#FF6B6B",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D1FF",
    borderRadius: 4,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.background,
  },
});
