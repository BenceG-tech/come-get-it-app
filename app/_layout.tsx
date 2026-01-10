import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "@/context/AppContext";
import Colors from "@/constants/colors";

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="venue/[id]" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="filter" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="rewards-missions" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="map" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="search" options={{ presentation: "card", headerShown: false }} />

      <Stack.Screen name="visit-history" options={{ presentation: "card", headerShown: true, title: "Látogatási előzmények" }} />
      <Stack.Screen name="credits-tokens" options={{ presentation: "card", headerShown: true, title: "Kreditek és Tokenek" }} />
      <Stack.Screen name="invite-friends" options={{ presentation: "card", headerShown: true, title: "Barátok meghívása" }} />
      <Stack.Screen name="favorites" options={{ presentation: "card", headerShown: true, title: "Kedvencek" }} />
      <Stack.Screen name="redeem-coupon" options={{ presentation: "card", headerShown: true, title: "Kuponkód beváltása" }} />
      <Stack.Screen name="help" options={{ presentation: "card", headerShown: true, title: "Segítség" }} />
      <Stack.Screen name="order-history" options={{ presentation: "card", headerShown: true, title: "Rendelési előzmények" }} />
      <Stack.Screen name="account" options={{ presentation: "card", headerShown: true, title: "Fiók" }} />
      <Stack.Screen name="payment-methods" options={{ presentation: "card", headerShown: true, title: "Fizetési módok" }} />
      <Stack.Screen name="addresses" options={{ presentation: "card", headerShown: true, title: "Címeim" }} />
      <Stack.Screen name="admin" options={{ presentation: "card", headerShown: true, title: "Admin" }} />
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