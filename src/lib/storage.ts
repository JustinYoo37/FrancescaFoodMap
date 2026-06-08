import type { Place, PlaceCategory } from "./types";
import { ALL_CATEGORIES } from "./categories";

export const PLACES_STORAGE_KEY = "my-travel-map-places-v1";

/** Older builds used Nightlife / Nature — map so saved places still load. */
function migrateLegacyCategory(raw: unknown): PlaceCategory | undefined {
  if (typeof raw !== "string") return undefined;
  if (ALL_CATEGORIES.includes(raw as PlaceCategory)) return raw as PlaceCategory;
  if (raw === "Nightlife") return "Shopping";
  if (raw === "Nature") return "Activities";
  return undefined;
}

function isCategory(v: unknown): v is PlaceCategory {
  return typeof v === "string" && ALL_CATEGORIES.includes(v as PlaceCategory);
}

/** Narrow unknown JSON into a Place when all required fields look valid. */
export function isValidPlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (typeof p.id !== "number" || !Number.isFinite(p.id)) return false;
  if (typeof p.name !== "string" || p.name.trim().length === 0) return false;
  if (typeof p.city !== "string" || p.city.trim().length === 0) return false;
  if (typeof p.country !== "string" || p.country.trim().length === 0)
    return false;
  if (!isCategory(migrateLegacyCategory(p.category) ?? p.category))
    return false;
  if (typeof p.lat !== "number" || !Number.isFinite(p.lat)) return false;
  if (typeof p.lng !== "number" || !Number.isFinite(p.lng)) return false;
  if (
    p.rating !== null &&
    (typeof p.rating !== "number" || !Number.isFinite(p.rating))
  )
    return false;
  if (typeof p.description !== "string") return false;
  if (!Array.isArray(p.images)) return false;
  if (!p.images.every((u) => typeof u === "string" && u.length > 0))
    return false;
  if (typeof p.mapLink !== "string" || p.mapLink.trim().length === 0)
    return false;
  return true;
}

export function loadUserPlaces(): Place[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLACES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed
      .filter((item): item is object => item !== null && typeof item === "object")
      .map((item) => {
        const o = item as Record<string, unknown>;
        const m = migrateLegacyCategory(o.category);
        if (m) return { ...o, category: m };
        return o;
      });
    return normalized.filter(isValidPlace) as Place[];
  } catch {
    return [];
  }
}

export function saveUserPlaces(places: Place[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(places));
  } catch {
    // Quota or private mode — fail silently; in-memory list still works for the session.
  }
}
