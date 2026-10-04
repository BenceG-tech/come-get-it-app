import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppContext";
import { syncCampaignNotifications } from "@/lib/campaignNotifications";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { LocationProvider } from "@/context/LocationContext";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";
// Defines the geofencing background task; must load at startup so iOS can wake the app for it.
import { isNearbyAlertsSupported, setPendingNotificationUrl, syncNearbyAlerts } from "@/lib/nearbyAlerts";

const BACK_TITLE = "Vissza";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch((error) => {
    console.warn("[SplashScreen] preventAutoHideAsync failed:", error);
  });
}

const handledNotificationIds = new Set<string>();

function notificationTarget(response: Notifications.NotificationResponse | null): string | null {
  if (!response) return null;
  const id = response.notification.request.identifier;
  if (handledNotificationIds.has(id)) return null;
  handledNotificationIds.add(id);
  const url = response.notification.request.content.data?.url;
  if (typeof url !== "string") return null;
  return ['/map', '/(tabs)/home', '/(tabs)/rewards'].includes(url) || /^\/(venue|reward)\/[a-zA-Z0-9-]+$/.test(url) ? url : null;
}

// Keeps nearby free-drink alerts registered and opens the venue when one is tapped.
function useNearbyAlerts() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (isNearbyAlertsSupported) syncNearbyAlerts({ refreshVenues: true }).catch((e) => console.warn("[NearbyAlerts] sync failed", e));
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isNearbyAlertsSupported) syncNearbyAlerts().catch((e) => console.warn("[NearbyAlerts] sync failed", e));
    });

    // Cold start from a tap: the entry screen still has to route by auth, so home opens the venue afterwards.
    const launchUrl = notificationTarget(Notifications.getLastNotificationResponse());
    if (launchUrl) {
      setPendingNotificationUrl(launchUrl);
      Notifications.clearLastNotificationResponse();
    }
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = notificationTarget(response);
      if (url) router.push(url as never);
    });
    return () => {
      appStateSub.remove();
      responseSub.remove();
    };
  }, []);
}

function RootLayoutNav() {
  useNearbyAlerts();
  const { session } = useAuth();
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || Platform.OS === 'web') return;
    const sync = (token?: Notifications.DevicePushToken) => {
      void syncCampaignNotifications(userId, token).catch(() => undefined);
    };
    sync();
    const appStateSub = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    const tokenSub = Notifications.addPushTokenListener(sync);
    return () => { appStateSub.remove(); tokenSub.remove(); };
  }, [session?.user.id]);
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="venue/[id]"
        options={{
          presentation: "modal",
          headerShown: false,
          animation: "slide_from_bottom",
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
      <Stack.Screen name="filter" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="map" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="search" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="favorites" options={{ presentation: "card", headerShown: true, title: "Kedvencek", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="help" options={{ presentation: "card", headerShown: true, title: "Segítség", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="account" options={{ presentation: "card", headerShown: true, title: "Fiók", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="my-impact" options={{ presentation: "card", headerShown: false }} />
      <Stack.Screen name="spend-points" options={{ presentation: "card", headerShown: true, title: "Költésből pont", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="venue-code" options={{ presentation: "card", headerShown: true, title: "Helykód", headerBackTitle: BACK_TITLE }} />
      <Stack.Screen name="nearby-alerts" options={{ presentation: "card", headerShown: true, title: "Közeli ingyen ital", headerBackTitle: BACK_TITLE }} />
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

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <FavoritesProvider>
              <LocationProvider>
                <AppProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </AppProvider>
              </LocationProvider>
            </FavoritesProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
