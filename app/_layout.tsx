import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "@/context/AppContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
// On web this can throw / behave differently, so guard + swallow to avoid blocking mount.
if (typeof window === 'undefined') {
  SplashScreen.preventAutoHideAsync().catch((e) => {
    console.warn('[SplashScreen] preventAutoHideAsync failed:', e);
  });
}

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
    SplashScreen.hideAsync().catch((e) => {
      console.warn('[SplashScreen] hideAsync failed:', e);
    });
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