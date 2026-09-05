import type { City, LandmarkCategory } from "./enums";

/**
 * A landmark search hit — either an exact/alias match against our seeded
 * Landmark table, or a live Mapbox geocoding fallback for free-text
 * addresses outside the curated list. See docs/VORA-BUILD.md §9.
 */
export interface LandmarkSearchResult {
  id: string;
  name: string;
  quartier: string | null;
  city: City | null;
  lat: number;
  lng: number;
  category: LandmarkCategory | null;
  source: "landmark" | "geocode";
}
