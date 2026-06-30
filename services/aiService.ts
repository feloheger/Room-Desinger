/**
 * aiService.ts
 *
 * Wraps the Google Gemini API (free tier via Google AI Studio) to analyze
 * a photo of a room and generate furniture/decor suggestions for an empty
 * spot in that room.
 *
 * Setup:
 * 1. Get a free API key at https://aistudio.google.com/app/apikey
 * 2. Add it to a `.env` file as EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
 *    (EXPO_PUBLIC_ prefix makes it available in the client bundle — fine
 *    for a free-tier prototyping key, but move this behind a backend
 *    proxy before shipping with a production key/billing account.)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from "expo-file-system";
import type { RoomAnalysisResult } from "@/types";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

if (!GEMINI_API_KEY) {
  console.warn(
    "[aiService] EXPO_PUBLIC_GEMINI_API_KEY is not set. Add it to your .env file."
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// gemini-1.5-flash is available on the free tier and supports vision input.
const MODEL_NAME = "gemini-1.5-flash";

/**
 * The instruction sent to Gemini alongside the image. We ask explicitly
 * for strict JSON so the response can be parsed deterministically.
 */
const ANALYSIS_PROMPT = `
Du bist ein professioneller Innenarchitekt. Analysiere das angehängte Foto eines Raumes.
Im Bild gibt es eine leere oder ungenutzte Stelle (z.B. eine leere Ecke, eine kahle Wand,
eine freie Fläche neben einem Möbelstück).

Deine Aufgabe:
1. Beschreibe kurz den vorhandenen Einrichtungsstil des Raumes (Farben, Materialien, Stil).
2. Schlage 3 konkrete Einrichtungsgegenstände vor, die perfekt an die leere Stelle passen
   und stilistisch zum Rest des Raumes passen würden.

Antworte AUSSCHLIESSLICH mit validem JSON in genau diesem Format, ohne Markdown-Codeblock,
ohne zusätzlichen Text davor oder danach:

{
  "roomStyleSummary": "string, 1-2 Sätze auf Deutsch",
  "suggestions": [
    {
      "category": "string, z.B. 'Stehlampe'",
      "description": "string, 1-2 Sätze, warum es passt",
      "colorPalette": ["string", "string"],
      "style": "string, z.B. 'Skandinavisch'",
      "estimatedPriceRange": "string, z.B. '€49 – €120'",
      "searchKeywords": "string, prägnante Suchbegriffe für eine Produktsuche, z.B. 'schwarze stehlampe minimalistisch'"
    }
  ]
}
`.trim();

/**
 * Converts a local image URI (from expo-camera / expo-image-picker) into
 * a base64 string suitable for inline upload to the Gemini API.
 */
async function imageUriToBase64(imageUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/**
 * Strips accidental Markdown code-fences from a model response, in case
 * the model wraps the JSON in ```json ... ``` despite instructions.
 */
function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Sends the room photo to Gemini and returns structured furniture
 * suggestions for the empty spot in the image.
 *
 * @param imageUri Local file URI of the captured/selected room photo.
 * @throws Error if the API key is missing, the request fails, or the
 *         model response cannot be parsed as the expected JSON shape.
 */
export async function analyzeRoomImage(
  imageUri: string
): Promise<RoomAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Kein Gemini API-Key konfiguriert. Bitte EXPO_PUBLIC_GEMINI_API_KEY in der .env-Datei setzen."
    );
  }

  const base64Image = await imageUriToBase64(imageUri);

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const result = await model.generateContent([
    { text: ANALYSIS_PROMPT },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image,
      },
    },
  ]);

  const rawText = result.response.text();
  const cleanedText = stripCodeFences(rawText);

  let parsed: RoomAnalysisResult;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (error) {
    console.error("[aiService] Failed to parse Gemini response:", rawText);
    throw new Error(
      "Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut."
    );
  }

  // Defensive normalization: ensure suggestions always have an id and
  // that the array exists, even if the model omits a field unexpectedly.
  const suggestions = (parsed.suggestions ?? []).map((suggestion, index) => ({
    ...suggestion,
    id: `suggestion-${index}-${Date.now()}`,
    colorPalette: suggestion.colorPalette ?? [],
  }));

  return {
    roomStyleSummary: parsed.roomStyleSummary ?? "",
    suggestions,
  };
}
