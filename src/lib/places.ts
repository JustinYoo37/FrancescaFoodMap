import type { Place } from "./types";

export function uniqueCountries(places: Place[]): string[] {
  const set = new Set(places.map((p) => p.country));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function nextPlaceId(places: Place[]): number {
  if (places.length === 0) return 1;
  return Math.max(...places.map((p) => p.id)) + 1;
}

export function defaultMapLink(place: Pick<Place, "name" | "city" | "country">) {
  const q = encodeURIComponent(
    [place.name, place.city, place.country].filter(Boolean).join(" "),
  );
  return `https://www.openstreetmap.org/search?query=${q}`;
}
