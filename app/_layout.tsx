import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "@/context/AppContext";

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="venue/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="filter" options={{ presentation: 'modal' }} />
      <Stack.Screen name="rewards-missions" options={{ presentation: 'card' }} />
      <Stack.Screen name="map" options={{ presentation: 'card' }} />
      <Stack.Screen name="search" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch((e) => {
        console.warn('[SplashScreen] hideAsync failed:', e);
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AppProvider>
    </SafeAreaProvider>
  );
}