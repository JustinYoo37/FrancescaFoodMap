"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { Place, PlaceCategory } from "@/lib/types";
import {
  buildMapLink,
  geocodePlaceQuery,
  reverseGeocodeCoordinates,
  type Coordinates,
} from "@/lib/locationLookup";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ALL_CATEGORIES } from "@/lib/categories";
import { spring } from "@/lib/motion";
import BasicModal from "@/components/ui/basic-modal";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, the sheet is in edit mode and submits via `onUpdate`. */
  placeToEdit?: Place | null;
  onSave: (draft: Omit<Place, "id">) => void;
  onUpdate?: (place: Place) => void;
  pickedLatLng: { lat: number; lng: number } | null;
  onPickedConsumed: () => void;
  mapPickActive: boolean;
  onStartMapPick: () => void;
  onCancelMapPick: () => void;
  onDraftLocationChange: (location: Coordinates | null) => void;
};

const LocationPreviewMap = dynamic(
  () => import("./AddPlaceSheetPreviewMap"),
  { ssr: false },
);

const inputBase =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-[15px] text-zinc-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-400 shadow-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-200/60";

const RATING_STEPS = [
  "",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
] as const;

/** Add-place sheet — single column; location and meta always visible (no collapsible section). */
export function AddPlaceSheet({
  open,
  onClose,
  placeToEdit = null,
  onSave,
  onUpdate,
  pickedLatLng,
  onPickedConsumed,
  mapPickActive,
  onStartMapPick,
  onCancelMapPick,
  onDraftLocationChange,
}: Props) {
  const isMobile = useIsMobile();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [addressQuery, setAddressQuery] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("Food");
  const [rating, setRating] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [mapLink, setMapLink] = useState("");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isGeocodingQuery, setIsGeocodingQuery] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);

  async function hydrateLocationDetails(coords: Coordinates) {
    reverseGeocodeAbortRef.current?.abort();
    const controller = new AbortController();
    reverseGeocodeAbortRef.current = controller;

    setIsResolvingLocation(true);
    const details = await reverseGeocodeCoordinates(coords, controller.signal);
    if (controller.signal.aborted) return;

    setIsResolvingLocation(false);
    if (!details) return;

    setCity((current) => current.trim() || details.city);
    setCountry((current) => current.trim() || details.country);
  }

  useEffect(() => {
    if (!pickedLatLng) return;
    const t = window.setTimeout(async () => {
      const nextLocation = { lat: pickedLatLng.lat, lng: pickedLatLng.lng };
      setLocation(nextLocation);
      setMapLink(buildMapLink(nextLocation));
      setStatus("Pin placed on the map.");
      setError(null);
      onPickedConsumed();
      await hydrateLocationDetails(nextLocation);
    }, 0);
    return () => window.clearTimeout(t);
  }, [pickedLatLng, onPickedConsumed]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const focus = window.setTimeout(() => {
      if (placeToEdit) nameInputRef.current?.focus();
      else addressInputRef.current?.focus();
    }, 100);
    return () => window.clearTimeout(focus);
  }, [open, placeToEdit?.id]);

  useEffect(() => {
    onDraftLocationChange(location);
  }, [location, onDraftLocationChange]);

  useEffect(() => {
    if (open) return;
    reverseGeocodeAbortRef.current?.abort();
  }, [open]);

  const reset = useCallback(() => {
    reverseGeocodeAbortRef.current?.abort();
    setAddressQuery("");
    setName("");
    setCity("");
    setCountry("");
    setCategory("Food");
    setRating("");
    setDescription("");
    setImages([]);
    setMapLink("");
    setLocation(null);
    setStatus(null);
    setIsGeocodingQuery(false);
    setIsResolvingLocation(false);
    setError(null);
    onCancelMapPick();
  }, [onCancelMapPick]);

  useEffect(() => {
    if (!open) return;
    if (placeToEdit) {
      reverseGeocodeAbortRef.current?.abort();
      setAddressQuery("");
      setName(placeToEdit.name);
      setCity(placeToEdit.city);
      setCountry(placeToEdit.country);
      setCategory(placeToEdit.category);
      setRating(placeToEdit.rating === null ? "" : String(placeToEdit.rating));
      setDescription(placeToEdit.description);
      setImages([...placeToEdit.images]);
      setMapLink(placeToEdit.mapLink);
      setLocation({ lat: placeToEdit.lat, lng: placeToEdit.lng });
      setStatus(null);
      setIsGeocodingQuery(false);
      setIsResolvingLocation(false);
      setError(null);
    } else {
      reset();
    }
  }, [open, placeToEdit, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGeocodeQuery = async (raw: string) => {
    const queryText = raw.trim();
    if (!queryText) return;

    setIsGeocodingQuery(true);
    setStatus("Finding that place…");
    setError(null);

    const result = await geocodePlaceQuery(queryText);
    setIsGeocodingQuery(false);

    if (!result) {
      setStatus("No match — try a different search or drop a pin on the map.");
      return;
    }

    setError(null);
    setLocation(result.coordinates);
    setMapLink(buildMapLink(result.coordinates));
    setName((current) => current.trim() || result.label);
    setCity((current) => current.trim() || result.city);
    setCountry((current) => current.trim() || result.country);
    setStatus("Found on the map.");
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setImages([]);
      return;
    }

    const dataUrls = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );

    setImages(dataUrls.filter(Boolean));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ratingTrim = rating.trim();
    const ratingN =
      ratingTrim === "" ? null : Number.parseFloat(ratingTrim);
    if (!location) {
      setError("Search for an address or drop a pin on the map to set the location.");
      return;
    }
    if (
      ratingN !== null &&
      (!Number.isFinite(ratingN) || ratingN < 0 || ratingN > 10)
    ) {
      setError("Pick a rating between 0 and 10, or leave it unset.");
      return;
    }
    const trimmedCity = city.trim() || "Unknown";
    const trimmedCountry = country.trim() || "Unknown";
    const trimmedName =
      name.trim() ||
      [trimmedCity, trimmedCountry].filter(Boolean).join(", ") ||
      "Pinned place";
    const link = mapLink.trim() || buildMapLink(location);

    const payload = {
      name: trimmedName,
      city: trimmedCity,
      country: trimmedCountry,
      category,
      lat: location.lat,
      lng: location.lng,
      rating: ratingN,
      description: description.trim(),
      images,
      mapLink: link,
    };

    if (placeToEdit) {
      onUpdate?.({ ...payload, id: placeToEdit.id });
    } else {
      onSave(payload);
    }
    reset();
    onClose();
  };

  const cityCountrySummary =
    [city.trim(), country.trim()].filter(Boolean).join(" · ") || null;

  if (mapPickActive) {
    return null;
  }

  return (
    <BasicModal
      isOpen={open}
      onClose={handleClose}
      layout={isMobile ? "bottom-sheet" : "center"}
      size="md"
      maxWidthClass={
        isMobile ? undefined : "max-w-[min(100vw-2rem,440px)]"
      }
      labelledBy="add-place-title"
      zBackdrop={1250}
      zContainer={1260}
      panelClassName="max-h-[min(92vh,720px)]"
      title={
        <h2
          id="add-place-title"
          className="text-lg font-bold tracking-tight text-zinc-900"
        >
          {placeToEdit ? "Edit place" : "Add a place"}
        </h2>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-full flex-col gap-6 px-5 py-6"
      >
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-900">
                  {error}
                </p>
              )}

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="add-place-address"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Search address
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={addressInputRef}
                      id="add-place-address"
                      className={inputBase}
                      value={addressQuery}
                      onChange={(e) => setAddressQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (!isGeocodingQuery) {
                          void handleGeocodeQuery(addressQuery);
                        }
                      }}
                      placeholder="Address in any language or English (city, country help)"
                      autoComplete="street-address"
                    />
                    <motion.button
                      type="button"
                      onClick={() => {
                        void handleGeocodeQuery(addressQuery);
                      }}
                      whileTap={{ scale: 0.99 }}
                      transition={spring.ui}
                      className="btn-gradient self-start rounded-xl px-5 py-2.5 text-sm font-bold tracking-wide disabled:cursor-not-allowed"
                      disabled={!addressQuery.trim() || isGeocodingQuery}
                    >
                      Find on map
                    </motion.button>
                  </div>
                </div>

                {status && (
                  <p className="text-sm leading-snug text-zinc-600">{status}</p>
                )}

                {isGeocodingQuery && (
                  <p className="text-xs font-medium text-zinc-500">Searching…</p>
                )}

                <div>
                  <label
                    htmlFor="add-place-name"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Place name
                  </label>
                  <input
                    ref={nameInputRef}
                    id="add-place-name"
                    className={inputBase}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Fills from search — change anytime"
                    autoComplete="off"
                  />
                </div>

                <motion.button
                  type="button"
                  onClick={() => {
                    setError(null);
                    if (mapPickActive) onCancelMapPick();
                    else onStartMapPick();
                  }}
                  whileTap={{ scale: 0.99 }}
                  transition={spring.ui}
                  className={`w-full rounded-xl border py-3 text-sm font-semibold transition-all duration-200 ${
                    mapPickActive
                      ? "border-pink-300 bg-pink-200 text-zinc-800 shadow-sm"
                      : "border-zinc-200 bg-zinc-50 text-zinc-900 shadow-sm hover:border-pink-300 hover:bg-pink-50/60"
                  }`}
                >
                  {mapPickActive
                    ? "Cancel pin on map"
                    : location
                      ? "Move pin on map"
                      : "Drop pin on map"}
                </motion.button>

                {location ? (
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                    <div className="aspect-[16/10] w-full">
                      <LocationPreviewMap
                        className="h-full w-full"
                        lat={location.lat}
                        lng={location.lng}
                      />
                    </div>
                    {cityCountrySummary && (
                      <p className="border-t border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600">
                        {cityCountrySummary}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    Search above or drop a pin to set where this place is.
                  </p>
                )}

                <div>
                  <label
                    htmlFor="add-place-city"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    City
                  </label>
                  <input
                    id="add-place-city"
                    className={inputBase}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={
                      isResolvingLocation ? "Looking up…" : "City"
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="add-place-country"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Country
                  </label>
                  <input
                    id="add-place-country"
                    className={inputBase}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={
                      isResolvingLocation ? "Looking up…" : "Country"
                    }
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-zinc-700">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                          category === cat
                            ? "border border-pink-300 bg-pink-200 text-zinc-800 shadow-sm"
                            : "border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-pink-200 hover:bg-pink-50/80"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-t border-zinc-200 pt-6">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4">
                  <p className="mb-2 text-sm font-semibold text-zinc-700">
                    Rating{" "}
                    <span className="font-normal text-zinc-500">(optional)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {RATING_STEPS.map((step) => {
                      const active =
                        step === ""
                          ? rating === ""
                          : rating === step;
                      return (
                        <motion.button
                          key={step === "" ? "none" : step}
                          type="button"
                          onClick={() => setRating(step === "" ? "" : step)}
                          whileTap={{ scale: 0.97 }}
                          transition={spring.ui}
                          className={`min-h-[40px] min-w-[2.25rem] rounded-full px-2 text-xs font-semibold transition-all duration-200 sm:min-w-[2.5rem] sm:px-2.5 sm:text-sm ${
                            active
                              ? "border border-pink-300 bg-pink-200 text-zinc-800 shadow-sm"
                              : "border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-pink-200 hover:bg-pink-50/80"
                          }`}
                        >
                          {step === "" ? "—" : step}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="add-place-notes" className="sr-only">
                    Notes
                  </label>
                  <textarea
                    id="add-place-notes"
                    className={`${inputBase} min-h-[100px] resize-y text-[15px] leading-relaxed`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why did you like it?"
                    rows={4}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-rose-800 underline decoration-pink-300 underline-offset-4 transition-colors hover:text-rose-950">
                    <span>+ Add photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        void handleFileChange(e.target.files);
                      }}
                    />
                  </label>
                  {images.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {images.length} photo{images.length === 1 ? "" : "s"}{" "}
                      attached
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex gap-3 border-t border-zinc-200 pt-5">
                <motion.button
                  type="button"
                  onClick={handleClose}
                  whileTap={{ scale: 0.99 }}
                  transition={spring.ui}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-colors duration-200 hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.99 }}
                  transition={spring.ui}
                  className="btn-gradient flex-1 rounded-xl py-3 text-sm font-bold tracking-wide"
                >
                  Save
                </motion.button>
              </div>
      </form>
    </BasicModal>
  );
}
