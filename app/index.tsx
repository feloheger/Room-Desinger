import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

/**
 * Welcome screen — the app's entry point.
 *
 * Extremely minimal "Clean White" layout: a short value proposition,
 * a hero illustration, and a single primary action that opens the
 * camera. Deliberately avoids visual noise — one accent (the dark
 * pill-shaped CTA) against an all-white canvas.
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const handleStartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/camera");
  };

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Top label */}
      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-sm font-medium tracking-widest text-ink-muted">
          AI INTERIOR
        </Text>
        <View className="h-2 w-2 rounded-full bg-ink" />
      </View>

      {/* Hero content */}
      <View className="flex-1 items-center justify-center">
        <View className="h-64 w-64 items-center justify-center rounded-xl bg-surface">
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
            }}
            style={{ width: "100%", height: "100%", borderRadius: 20 }}
            contentFit="cover"
            transition={300}
          />
        </View>

        <Text className="mt-10 text-center text-4xl font-semibold text-ink">
          Verwandle jede{"\n"}leere Ecke
        </Text>
        <Text className="mt-4 max-w-[280px] text-center text-base leading-6 text-ink-soft">
          Fotografiere eine freie Stelle in deinem Raum. Unsere KI schlägt
          passende Möbel vor — inklusive echter Produkte.
        </Text>
      </View>

      {/* Primary action */}
      <View className="mb-6 gap-3">
        <Pressable
          onPress={handleStartPress}
          className="h-14 items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <Text className="text-base font-semibold text-accent-foreground">
            Raum fotografieren
          </Text>
        </Pressable>
        <Text className="text-center text-xs text-ink-muted">
          Kostenlos · Keine Anmeldung erforderlich
        </Text>
      </View>
    </View>
  );
}
