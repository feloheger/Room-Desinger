import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { analyzeRoomImage } from "@/services/aiService";
import { searchFurnitureForSuggestions } from "@/services/furnitureSearchService";
import type {
  FurnitureProduct,
  FurnitureSuggestion,
  ResultScreenParams,
  RoomAnalysisResult,
} from "@/types";

type LoadState = "analyzing" | "searching" | "ready" | "error";

/**
 * Result screen — shows the captured room photo, the AI's style summary,
 * and a list of furniture suggestions, each with real(istic) matching
 * products the user can tap through to buy.
 *
 * Flow:
 *   1. On mount, send the photo to Gemini (analyzeRoomImage).
 *   2. Once suggestions come back, search for matching products in
 *      parallel for every suggestion.
 *   3. Render everything in a single scrollable "Clean White" page:
 *      photo header → style summary → suggestion cards → product chips.
 */
export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const { imageUri } = useLocalSearchParams<ResultScreenParams>();

  const [loadState, setLoadState] = useState<LoadState>("analyzing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RoomAnalysisResult | null>(null);
  const [productsBySuggestion, setProductsBySuggestion] = useState<
    Record<string, FurnitureProduct[]>
  >({});

  const runPipeline = useCallback(async () => {
    if (!imageUri) {
      setErrorMessage("Kein Bild gefunden. Bitte versuche es erneut.");
      setLoadState("error");
      return;
    }

    try {
      setLoadState("analyzing");
      const result = await analyzeRoomImage(imageUri);
      setAnalysis(result);

      setLoadState("searching");
      const products = await searchFurnitureForSuggestions(
        result.suggestions
      );
      setProductsBySuggestion(products);

      setLoadState("ready");
    } catch (error) {
      console.error("[result] Pipeline failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Etwas ist schiefgelaufen. Bitte versuche es erneut."
      );
      setLoadState("error");
    }
  }, [imageUri]);

  useEffect(() => {
    runPipeline();
  }, [runPipeline]);

  const handleOpenProduct = (url: string) => {
    Linking.openURL(url).catch((error) =>
      console.error("[result] Failed to open product URL:", error)
    );
  };

  // --- Loading / error states -------------------------------------------

  if (loadState === "analyzing" || loadState === "searching") {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-10"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator size="large" color="#0A0A0A" />
        <Text className="mt-6 text-center text-base font-medium text-ink">
          {loadState === "analyzing"
            ? "Analysiere deinen Raum …"
            : "Suche passende Möbelstücke …"}
        </Text>
        <Text className="mt-2 text-center text-sm text-ink-muted">
          Das kann ein paar Sekunden dauern.
        </Text>
      </View>
    );
  }

  if (loadState === "error") {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
        </View>
        <Text className="mt-6 text-center text-lg font-semibold text-ink">
          Analyse fehlgeschlagen
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-ink-soft">
          {errorMessage}
        </Text>
        <Pressable
          onPress={runPipeline}
          className="mt-8 h-12 w-full items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <Text className="text-base font-semibold text-accent-foreground">
            Erneut versuchen
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-sm font-medium text-ink-muted">
            Zurück zur Kamera
          </Text>
        </Pressable>
      </View>
    );
  }

  // --- Ready state ---------------------------------------------------------

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Nav bar */}
      <View className="flex-row items-center justify-between px-5 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="chevron-back" size={20} color="#0A0A0A" />
        </Pressable>
        <Text className="text-sm font-semibold tracking-wide text-ink">
          DEIN KONZEPT
        </Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Room photo */}
        <View className="mx-5 mt-2 overflow-hidden rounded-xl bg-surface">
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: 280 }}
            contentFit="cover"
          />
        </View>

        {/* Style summary */}
        {analysis?.roomStyleSummary ? (
          <View className="mx-5 mt-5">
            <Text className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
              Stil-Analyse
            </Text>
            <Text className="mt-2 text-base leading-6 text-ink-soft">
              {analysis.roomStyleSummary}
            </Text>
          </View>
        ) : null}

        {/* Suggestions */}
        <View className="mt-7 gap-6">
          {analysis?.suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              index={index}
              suggestion={suggestion}
              products={productsBySuggestion[suggestion.id] ?? []}
              onOpenProduct={handleOpenProduct}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** Renders one AI suggestion with its style metadata and matched products. */
function SuggestionCard({
  index,
  suggestion,
  products,
  onOpenProduct,
}: {
  index: number;
  suggestion: FurnitureSuggestion;
  products: FurnitureProduct[];
  onOpenProduct: (url: string) => void;
}) {
  return (
    <View className="mx-5 rounded-xl border border-border bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Vorschlag {index + 1} · {suggestion.style}
          </Text>
          <Text className="mt-1 text-lg font-semibold text-ink">
            {suggestion.category}
          </Text>
        </View>
        <Text className="text-sm font-medium text-ink-soft">
          {suggestion.estimatedPriceRange}
        </Text>
      </View>

      <Text className="mt-2 text-sm leading-5 text-ink-soft">
        {suggestion.description}
      </Text>

      {/* Color palette dots */}
      {suggestion.colorPalette.length > 0 ? (
        <View className="mt-3 flex-row gap-2">
          {suggestion.colorPalette.map((color, i) => (
            <View
              key={`${suggestion.id}-color-${i}`}
              className="rounded-full border border-border bg-surface px-3 py-1"
            >
              <Text className="text-xs text-ink-soft">{color}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Matched products */}
      {products.length > 0 ? (
        <View className="mt-4 gap-2">
          <Text className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Passende Produkte
          </Text>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onPress={() => onOpenProduct(product.productUrl)}
            />
          ))}
        </View>
      ) : (
        <Text className="mt-4 text-xs text-ink-muted">
          Keine passenden Produkte gefunden.
        </Text>
      )}
    </View>
  );
}

/** A single tappable IKEA-style product row used inside a SuggestionCard. */
function ProductRow({
  product,
  onPress,
}: {
  product: FurnitureProduct;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-md bg-surface p-2.5 active:opacity-70"
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={{ width: 52, height: 52, borderRadius: 8 }}
        contentFit="cover"
      />
      <View className="flex-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {product.brand}
        </Text>
        <Text className="text-sm font-medium text-ink" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-sm font-semibold text-ink">
          {product.currency}
          {product.price}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
    </Pressable>
  );
}
