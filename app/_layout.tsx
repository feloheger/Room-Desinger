import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

/**
 * Root layout for the entire app.
 *
 * Defines the navigation stack and applies the global "Clean White"
 * status bar style. All screens inherit a white background and no
 * header by default, since every screen builds its own minimal nav bar.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFFFFF" },
            animation: "fade_from_bottom",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="camera" options={{ animation: "fade" }} />
          <Stack.Screen name="result" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
