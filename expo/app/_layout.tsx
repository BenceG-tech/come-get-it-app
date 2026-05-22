import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";

const BACK_TITLE = "Vissza";

function RootLayoutNav() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="venue/[id]" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="filter" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="rewards-missions" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="map" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="search" options={{ presentation: "card", headerShown: false }} />

      <Stack.Screen name="visit-history" options={{ presentation: "card", headerShown: true, title: "Látogatási előzmények", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="credits-tokens" options={{ presentation: "card", headerShown: true, title: "Kreditek és Tokenek", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="invite-friends" options={{ presentation: "card", headerShown: true, title: "Barátok meghívása", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="favorites" options={{ presentation: "card", headerShown: true, title: "Kedvencek", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="redeem-coupon" options={{ presentation: "card", headerShown: true, title: "Kuponkód beváltása", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="help" options={{ presentation: "card", headerShown: true, title: "Segítség", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="order-history" options={{ presentation: "card", headerShown: true, title: "Rendelési előzmények", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="account" options={{ presentation: "card", headerShown: true, title: "Fiók", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="payment-methods" options={{ presentation: "card", headerShown: true, title: "Fizetési módok", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="addresses" options={{ presentation: "card", headerShown: true, title: "Címeim", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="admin" options={{ presentation: "card", headerShown: true, title: "Admin", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="my-impact" options={{ presentation: "card", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState<QueryClient>(() => {
    console.log("[ReactQuery] Creating QueryClient");
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          staleTime: 30_000,
        },
      },
    });
  });

  useEffect(() => {
    if (Platform.OS !== "web") {
      SplashScreen.hideAsync().catch((e) => {
        console.warn("[SplashScreen] hideAsync failed:", e);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <FavoritesProvider>
              <AppProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </AppProvider>
            </FavoritesProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}