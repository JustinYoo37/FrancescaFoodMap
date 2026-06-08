"use client";

import { Map, MapControls } from "@/components/map/maplibre-ui";
import type { Place } from "@/lib/types";
import type { Coordinates } from "@/lib/locationLookup";
import {
  TravelFlyToSelected,
  TravelMapFocus,
  TravelMapPick,
  TravelPlacesCluster,
  TravelPreviewLocation,
} from "./TravelMapEffects";

type Props = {
  places: Place[];
  selectedId: number | null;
  selectedPlace: Place | null;
  focusKey: string;
  onSelect: (place: Place) => void;
  onReady: () => void;
  mapPickActive: boolean;
  onMapLocationPick: (lat: number, lng: number) => void;
  previewLocation: Coordinates | null;
};

const lightBasemap =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/**
 * MapLibre map (Carto Positron — light / white basemap) with clustered places,
 * fly-to selection, filter fit-bounds, and map-pick mode.
 */
export function TravelMap({
  places,
  selectedId,
  selectedPlace,
  focusKey,
  onSelect,
  onReady,
  mapPickActive,
  onMapLocationPick,
  previewLocation,
}: Props) {
  return (
    <div className="travel-map h-full w-full outline-none">
      <Map
        styles={{ dark: lightBasemap, light: lightBasemap }}
        center={[0, 20]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollZoom
        attributionControl={{ compact: true }}
        renderWorldCopies={false}
        onLoad={onReady}
      >
        <TravelPlacesCluster
          places={places}
          selectedId={selectedId}
          markersInteractive={!mapPickActive}
          onSelect={onSelect}
        />
        <TravelMapFocus places={places} focusKey={focusKey} />
        <TravelFlyToSelected place={selectedPlace} />
        <TravelMapPick
          active={mapPickActive}
          onPick={onMapLocationPick}
        />
        <TravelPreviewLocation location={previewLocation} />
        <MapControls position="bottom-right" />
      </Map>
    </div>
  );
}
