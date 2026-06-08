/** Shared types for travel recommendations and map state. */

export type PlaceCategory = "Food" | "Activities" | "Shopping";

export type Place = {
  id: number;
  name: string;
  city: string;
  country: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  /** `null` when the user leaves rating blank. */
  rating: number | null;
  description: string;
  images: string[];
  mapLink: string;
};
