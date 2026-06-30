/**
 * furnitureSearchService.ts
 *
 * Finds real-world furniture products that match an AI-generated
 * FurnitureSuggestion.
 *
 * This ships as a deterministic MOCK service so the app works fully
 * offline and without any paid/rate-limited API out of the box. IKEA
 * has no public product-search API for third parties, so two real
 * upgrade paths are documented below if you want live data:
 *
 *   1. SerpApi "Google Shopping" engine (has a free trial tier) —
 *      query `site:ikea.com <searchKeywords>` and map the results.
 *   2. A small self-hosted scraper/proxy that queries ikea.com's
 *      internal search-suggestions endpoint and normalizes the result
 *      to the FurnitureProduct shape below.
 *
 * Swap MOCK_CATALOG + searchMockCatalog() for a real fetch() call to
 * either of those once you have an endpoint — the public function
 * signature (searchFurnitureProducts) does not need to change.
 */

import type { FurnitureProduct, FurnitureSuggestion } from "@/types";

/**
 * Small static catalog of realistic, IKEA-style placeholder products.
 * Image URLs point to stable Unsplash placeholders so the UI always
 * has something to render without needing real product photography.
 */
const MOCK_CATALOG: Omit<FurnitureProduct, "id" | "matchedSuggestionId">[] = [
  {
    name: "NYMÅNE Stehlampe",
    brand: "IKEA",
    price: "39,99",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=nymane+stehlampe",
  },
  {
    name: "BILLY Bücherregal, weiß",
    brand: "IKEA",
    price: "59,99",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=billy+buecherregal",
  },
  {
    name: "FEJKA Kunstpflanze im Topf",
    brand: "IKEA",
    price: "14,99",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=fejka+kunstpflanze",
  },
  {
    name: "POÄNG Sessel, Eschenfurnier",
    brand: "IKEA",
    price: "129,00",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=poaeng+sessel",
  },
  {
    name: "LACK Beistelltisch, weiß",
    brand: "IKEA",
    price: "12,99",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=lack+beistelltisch",
  },
  {
    name: "SKOGSFJÄLL Kissenbezug",
    brand: "IKEA",
    price: "9,99",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=kissenbezug",
  },
  {
    name: "KVISTBRO Aufbewahrungswürfel",
    brand: "IKEA",
    price: "44,99",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=kvistbro",
  },
  {
    name: "RÅSKOG Rollwagen",
    brand: "IKEA",
    price: "29,99",
    currency: "€",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    productUrl: "https://www.ikea.com/de/de/search/?q=raskog+rollwagen",
  },
];

/** Deterministically picks N items from the catalog based on a string seed. */
function pickDeterministic<T>(
  catalog: T[],
  seed: string,
  count: number
): T[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const startIndex = Math.abs(hash) % catalog.length;
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(catalog[(startIndex + i) % catalog.length]);
  }
  return result;
}

/**
 * Simulates an async network search against the mock catalog, filtering
 * loosely by keyword overlap when possible and falling back to a
 * deterministic pick so results stay stable across re-renders.
 */
async function searchMockCatalog(
  suggestion: FurnitureSuggestion
): Promise<Omit<FurnitureProduct, "id" | "matchedSuggestionId">[]> {
  // Simulate network latency for a realistic loading state in the UI.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const keywords = suggestion.searchKeywords.toLowerCase();
  const categoryWord = suggestion.category.toLowerCase();

  const keywordMatches = MOCK_CATALOG.filter((item) => {
    const name = item.name.toLowerCase();
    return (
      keywords.split(" ").some((word) => word.length > 3 && name.includes(word)) ||
      name.includes(categoryWord)
    );
  });

  if (keywordMatches.length > 0) {
    return keywordMatches.slice(0, 2);
  }

  // No direct keyword hit — fall back to a stable deterministic pick so
  // the user still sees relevant-looking, consistent suggestions.
  return pickDeterministic(MOCK_CATALOG, suggestion.searchKeywords, 2);
}

/**
 * Finds matching real-world furniture products for a single AI
 * suggestion. Returns an empty array if nothing reasonable is found
 * rather than throwing, so one failed lookup doesn't break the whole
 * results screen.
 */
export async function searchFurnitureProducts(
  suggestion: FurnitureSuggestion
): Promise<FurnitureProduct[]> {
  try {
    const matches = await searchMockCatalog(suggestion);
    return matches.map((item, index) => ({
      ...item,
      id: `${suggestion.id}-product-${index}`,
      matchedSuggestionId: suggestion.id,
    }));
  } catch (error) {
    console.error("[furnitureSearchService] Search failed:", error);
    return [];
  }
}

/**
 * Convenience helper to fetch products for a whole list of suggestions
 * in parallel, preserving suggestion order.
 */
export async function searchFurnitureForSuggestions(
  suggestions: FurnitureSuggestion[]
): Promise<Record<string, FurnitureProduct[]>> {
  const results = await Promise.all(
    suggestions.map((suggestion) => searchFurnitureProducts(suggestion))
  );

  return suggestions.reduce<Record<string, FurnitureProduct[]>>(
    (acc, suggestion, index) => {
      acc[suggestion.id] = results[index];
      return acc;
    },
    {}
  );
}
