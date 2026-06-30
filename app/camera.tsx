import { useRef, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

/**
 * Camera screen — lets the user photograph the empty spot in their room,
 * or pick an existing photo from their library as a fallback.
 *
 * Kept deliberately sparse: a live camera preview fills the screen,
 * with a single circular shutter button and a small gallery-import
 * affordance, both floating over the feed in the "Clean White" style
 * (white icons on translucent dark chips, since they sit on a live
 * camera feed rather than a white background).
 */
export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>("back");
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const navigateToResult = (imageUri: string) => {
    router.push({
      pathname: "/result",
      params: { imageUri },
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        navigateToResult(photo.uri);
      }
    } catch (error) {
      console.error("[camera] Failed to capture photo:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      navigateToResult(result.assets[0].uri);
    }
  };

  // --- Permission states -----------------------------------------------

  if (!permission) {
    // Permissions are still loading.
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#0A0A0A" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Ionicons name="camera-outline" size={28} color="#52525B" />
        </View>
        <Text className="mt-6 text-center text-xl font-semibold text-ink">
          Kamerazugriff benötigt
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-ink-soft">
          Um ein Foto deines Raumes aufzunehmen, benötigen wir Zugriff auf
          deine Kamera.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="mt-8 h-12 w-full items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <Text className="text-base font-semibold text-accent-foreground">
            Zugriff erlauben
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-sm font-medium text-ink-muted">
            Zurück
          </Text>
        </Pressable>
      </View>
    );
  }

  // --- Main camera UI ----------------------------------------------------

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        {/* Top bar */}
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>

          <View className="rounded-full bg-black/40 px-4 py-2">
            <Text className="text-xs font-medium text-white">
              Fotografiere die leere Stelle
            </Text>
          </View>

          <View className="h-10 w-10" />
        </View>

        {/* Framing guide */}
        <View className="flex-1 items-center justify-center px-10">
          <View className="aspect-square w-full rounded-3xl border-2 border-dashed border-white/50" />
        </View>

        {/* Bottom controls */}
        <View
          className="flex-row items-center justify-between px-10 pb-4"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Pressable
            onPress={handlePickFromLibrary}
            className="h-12 w-12 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="images-outline" size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/90"
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="h-16 w-16 rounded-full bg-white" />
            )}
          </Pressable>

          {/* Spacer to balance the gallery button on the left */}
          <View className="h-12 w-12" />
        </View>
      </CameraView>
    </View>
  );
}
