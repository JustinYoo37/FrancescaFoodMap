export type Coordinates = {
  lat: number;
  lng: number;
};

export type GeocodedPlace = {
  coordinates: Coordinates;
  label: string;
  city: string;
  country: string;
  displayName: string;
};

type ReverseGeocodeResult = {
  city: string;
  country: string;
};

/** Opens in the browser; on phones, often hands off to the Google Maps app. */
export function buildMapLink({ lat, lng }: Coordinates): string {
  const query = `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export async function reverseGeocodeCoordinates(
  { lat, lng }: Coordinates,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    zoom: "14",
    addressdetails: "1",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en,ko,ja,zh-Hans,es,fr,de",
          "User-Agent": "Food-Map/1.0",
        },
        signal,
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      address?: Record<string, string | undefined>;
    };
    const address = data.address;
    if (!address) return null;

    const city =
      address.city ??
      address.city_district ??
      address.town ??
      address.village ??
      address.municipality ??
      address.suburb ??
      address.county ??
      "";
    const country = address.country ?? "";

    if (!city && !country) return null;
    return { city, country };
  } catch {
    return null;
  }
}

export async function geocodePlaceQuery(
  raw: string,
): Promise<GeocodedPlace | null> {
  const query = raw.trim();
  if (!query) return null;

  try {
    const response = await fetch(
      `/api/geocode-place?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      result?: {
        lat: number;
        lng: number;
        label: string;
        city: string;
        country: string;
        displayName: string;
      } | null;
    };

    if (!data.result) return null;

    return {
      coordinates: {
        lat: data.result.lat,
        lng: data.result.lng,
      },
      label: data.result.label,
      city: data.result.city,
      country: data.result.country,
      displayName: data.result.displayName,
    };
  } catch {
    return null;
  }
}
