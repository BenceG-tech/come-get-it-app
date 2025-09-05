import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/context/AppContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </AppProvider>
  );
}