import type { Place, PlaceCategory } from "./types";

export function filterPlaces(
  places: Place[],
  country: string | "all",
  category: PlaceCategory | "all",
): Place[] {
  return places.filter((p) => {
    const okCountry = country === "all" || p.country === country;
    const okCat = category === "all" || p.category === category;
    return okCountry && okCat;
  });
}
