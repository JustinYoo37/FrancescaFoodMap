"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { easeOut, fade } from "@/lib/motion";
import { uniqueCountries, nextPlaceId } from "@/lib/places";
import { loadUserPlaces, saveUserPlaces } from "@/lib/storage";
import { filterPlaces } from "@/lib/filterPlaces";
import type { Place, PlaceCategory } from "@/lib/types";
import type { Coordinates } from "@/lib/locationLookup";
import { confirmDeleteAll, confirmDeletePlace } from "@/lib/confirmDelete";
import { FilterBar } from "./FilterBar";
import { PlaceList } from "./PlaceList";
import { LocationDetail } from "./LocationDetail";
import { MapSkeleton } from "./MapSkeleton";
import { AddPlaceSheet } from "./AddPlaceSheet";
import { AboutModal } from "./AboutModal";

const TravelMap = dynamic(
  () => import("./TravelMap").then((m) => m.TravelMap),
  { ssr: false },
);

/**
 * Client shell: loads/saves places in localStorage, map, filters, add flow.
 */
export default function TravelApp() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [storeReady, setStoreReady] = useState(false);

  const [country, setCountry] = useState<string | "all">("all");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [selected, setSelected] = useState<Place | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [mapPickActive, setMapPickActive] = useState(false);
  const [pickedLatLng, setPickedLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [draftLocation, setDraftLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPlaces(loadUserPlaces());
      setStoreReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!storeReady) return;
    saveUserPlaces(places);
  }, [places, storeReady]);

  const filtered = useMemo(
    () => filterPlaces(places, country, category),
    [places, country, category],
  );

  const countries = useMemo(() => uniqueCountries(places), [places]);

  const focusKey = useMemo(
    () => `${country}-${category}-${filtered.map((p) => p.id).join(",")}`,
    [country, category, filtered],
  );

  const handleCountry = useCallback(
    (c: string | "all") => {
      setCountry(c);
      setSelected((prev) => {
        if (!prev) return null;
        const next = filterPlaces(places, c, category);
        return next.some((p) => p.id === prev.id) ? prev : null;
      });
    },
    [places, category],
  );

  const handleCategory = useCallback(
    (cat: PlaceCategory | "all") => {
      setCategory(cat);
      setSelected((prev) => {
        if (!prev) return null;
        const next = filterPlaces(places, country, cat);
        return next.some((p) => p.id === prev.id) ? prev : null;
      });
    },
    [places, country],
  );

  const handleSelect = useCallback((place: Place) => {
    setSelected(place);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  const cancelMapPick = useCallback(() => {
    setMapPickActive(false);
  }, []);

  const onPickedConsumed = useCallback(() => setPickedLatLng(null), []);

  const handleMapLocationPick = useCallback(
    (lat: number, lng: number) => {
      if (!mapPickActive) return;
      setPickedLatLng({ lat, lng });
      setMapPickActive(false);
    },
    [mapPickActive],
  );

  const openAddPlace = useCallback(() => {
    setEditingPlace(null);
    setSelected(null);
    setMapPickActive(false);
    setPickedLatLng(null);
    setDraftLocation(null);
    setAddOpen(true);
  }, []);

  const openEditPlace = useCallback((place: Place) => {
    setEditingPlace(place);
    setSelected(null);
    setMapPickActive(false);
    setPickedLatLng(null);
    setDraftLocation(null);
    setAddOpen(true);
  }, []);

  const handleSaveNewPlace = useCallback((draft: Omit<Place, "id">) => {
    setPlaces((prev) => {
      const id = nextPlaceId(prev);
      return [...prev, { ...draft, id }];
    });
  }, []);

  const handleUpdatePlace = useCallback((place: Place) => {
    setPlaces((prev) => prev.map((p) => (p.id === place.id ? place : p)));
    setSelected(place);
  }, []);

  const handleDeletePlace = useCallback((place: Place) => {
    if (!confirmDeletePlace(place.name)) return;
    setPlaces((prev) => prev.filter((p) => p.id !== place.id));
    setSelected((s) => (s?.id === place.id ? null : s));
  }, []);

  const handleDeleteAllPlaces = useCallback(() => {
    if (!confirmDeleteAll(places.length)) return;
    setPlaces([]);
    setSelected(null);
  }, [places.length]);

  return (
    <motion.div
      className="relative h-[100dvh] w-full overflow-hidden bg-background"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      <div className="absolute inset-0">
        <TravelMap
          places={filtered}
          selectedId={selected?.id ?? null}
          selectedPlace={selected}
          focusKey={focusKey}
          onSelect={handleSelect}
          onReady={() => setMapReady(true)}
          mapPickActive={mapPickActive}
          onMapLocationPick={handleMapLocationPick}
          previewLocation={draftLocation}
        />
      </div>

      <AnimatePresence>
        {!mapReady && (
          <div className="pointer-events-auto absolute inset-0 z-[600]">
            <MapSkeleton />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapPickActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={fade.in}
            className="chrome-panel-light pointer-events-none fixed left-1/2 top-[4.75rem] z-[1350] flex max-w-[min(92vw,20rem)] -translate-x-1/2 flex-col items-center gap-2.5 px-4 py-3 text-center md:top-[5.5rem]"
          >
            <p className="text-xs font-semibold leading-snug text-zinc-700">
              Click the map to drop a pin for this place
            </p>
            <motion.button
              type="button"
              className="pointer-events-auto rounded-xl border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition-colors duration-200 hover:border-pink-300 hover:bg-pink-50/70"
              onClick={cancelMapPick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Cancel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] px-4 pt-4 md:px-6 md:pt-5">
        <FilterBar
          countries={countries}
          country={country}
          category={category}
          onCountry={handleCountry}
          onCategory={handleCategory}
          resultCount={filtered.length}
          savedPlaceCount={places.length}
          onAddPlace={openAddPlace}
          onDeleteAllPlaces={
            places.length > 0 ? handleDeleteAllPlaces : undefined
          }
          onAbout={() => setAboutOpen(true)}
        />
      </div>

      <div className="pointer-events-none absolute bottom-6 left-4 right-auto top-[6.75rem] z-[1100] hidden md:block">
        <PlaceList
          places={filtered}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
        />
      </div>

      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      <AddPlaceSheet
        open={addOpen}
        placeToEdit={editingPlace}
        onClose={() => {
          setAddOpen(false);
          setEditingPlace(null);
          cancelMapPick();
          setDraftLocation(null);
        }}
        onSave={handleSaveNewPlace}
        onUpdate={handleUpdatePlace}
        pickedLatLng={pickedLatLng}
        onPickedConsumed={onPickedConsumed}
        mapPickActive={mapPickActive}
        onStartMapPick={() => setMapPickActive(true)}
        onCancelMapPick={cancelMapPick}
        onDraftLocationChange={setDraftLocation}
      />

      <LocationDetail
        place={selected}
        onClose={handleClose}
        onEdit={openEditPlace}
        onDelete={handleDeletePlace}
      />
    </motion.div>
  );
}
