import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Az oldal nem található" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Ez az oldal nem található.</Text>
        <Text style={styles.subtitle}>Lehet, hogy a hivatkozás már nem érvényes.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Vissza a Come Get Ithez</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
});
