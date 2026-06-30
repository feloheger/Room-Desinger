/**
 * Shared TypeScript types for the AI Interior Designer app.
 */

/** A single furniture suggestion produced by the AI analysis. */
export interface FurnitureSuggestion {
  /** Stable identifier used as a React key. */
  id: string;
  /** Short product category, e.g. "Floor Lamp", "Bookshelf". */
  category: string;
  /** Human-readable description of the suggested item and why it fits. */
  description: string;
  /** Dominant color palette suggested for this item (hex or name). */
  colorPalette: string[];
  /** Approximate style tag, e.g. "Scandinavian", "Minimalist". */
  style: string;
  /** Estimated price range in EUR, as free text (e.g. "€49 – €120"). */
  estimatedPriceRange: string;
  /** Search keywords used to find a matching real-world product. */
  searchKeywords: string;
}

/** The full structured result returned by the AI analysis step. */
export interface RoomAnalysisResult {
  /** One-paragraph summary of the room's existing style. */
  roomStyleSummary: string;
  /** List of suggested furniture/decor items for the empty spot. */
  suggestions: FurnitureSuggestion[];
}

/** A real (or mocked) furniture product matched from a retailer. */
export interface FurnitureProduct {
  id: string;
  name: string;
  brand: "IKEA" | "Other";
  price: string;
  currency: string;
  imageUrl: string;
  productUrl: string;
  /** The FurnitureSuggestion.id this product matches against. */
  matchedSuggestionId: string;
}

/** Navigation params passed from camera.tsx to result.tsx. */
export interface ResultScreenParams {
  imageUri: string;
}
