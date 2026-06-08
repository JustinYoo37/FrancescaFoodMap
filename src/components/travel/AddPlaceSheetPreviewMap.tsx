"use client";

import type { GeoJSONSource } from "maplibre-gl";
import { useEffect } from "react";
import { Map, useMap } from "@/components/map/maplibre-ui";

type Props = {
  className?: string;
  lat: number;
  lng: number;
};

const lightBasemap =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const SRC = "add-preview-src";
const LYR = "add-preview-lyr";

function PreviewPin({ lat, lng }: { lat: number; lng: number }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const add = () => {
      if (map.getSource(SRC)) return;
      map.addSource(SRC, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: LYR,
        type: "circle",
        source: SRC,
        paint: {
          "circle-radius": 10,
          "circle-color": "#67e8f9",
          "circle-opacity": 0.88,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#22d3ee",
        },
      });
    };

    if (map.isStyleLoaded()) add();
    else map.once("styledata", add);

    return () => {
      map.off("styledata", add);
      try {
        if (map.getLayer(LYR)) map.removeLayer(LYR);
        if (map.getSource(SRC)) map.removeSource(SRC);
      } catch {
        /* ignore */
      }
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource(SRC) as GeoJSONSource | undefined;
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [lng, lat] },
        },
      ],
    });
  }, [map, isLoaded, lat, lng]);

  return null;
}

/** Small read-only MapLibre preview — same light basemap as the main map. */
export default function AddPlaceSheetPreviewMap({ className, lat, lng }: Props) {
  return (
    <Map
      styles={{ dark: lightBasemap, light: lightBasemap }}
      className={className}
      center={[lng, lat]}
      zoom={13}
      minZoom={2}
      maxZoom={18}
      interactive={false}
      scrollZoom={false}
      dragRotate={false}
      boxZoom={false}
      dragPan={false}
      keyboard={false}
      doubleClickZoom={false}
      touchZoomRotate={false}
      attributionControl={false}
    >
      <PreviewPin lat={lat} lng={lng} />
    </Map>
  );
}
