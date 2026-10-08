import { Stack } from "expo-router";
import Colors from "@/constants/colors";

// Keep the rewards home behind a category, including when opened via a deep link.
export const unstable_settings = { initialRouteName: "rewards" };

export default function RewardsLayout() {
  return (
    <Stack
      initialRouteName="rewards"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="rewards" />
      <Stack.Screen
        name="rewards-category"
        options={{
          presentation: "card",
          animation: "slide_from_right",
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          gestureDirection: "horizontal",
          animationMatchesGesture: true,
        }}
      />
    </Stack>
  );
}
