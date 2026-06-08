"use client";

import maplibregl, {
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import { useCallback, useEffect, useRef } from "react";
import { useMap } from "@/components/map/maplibre-ui";
import { CATEGORY_STYLES } from "@/lib/categories";
import type { Coordinates } from "@/lib/locationLookup";
import type { Place } from "@/lib/types";

const SOURCE_ID = "ft-places";
const L_CLUSTERS = "ft-clusters";
const L_CLUSTER_COUNT = "ft-cluster-count";
const L_UNCLUSTERED = "ft-unclustered";
const SRC_PREVIEW = "ft-preview";
const L_PREVIEW = "ft-preview-dot";

const categoryCircleColor = [
  "match",
  ["get", "category"],
  "Food",
  CATEGORY_STYLES.Food.marker,
  "Activities",
  CATEGORY_STYLES.Activities.marker,
  "Shopping",
  CATEGORY_STYLES.Shopping.marker,
  "#64748b",
];

function placesToGeoJSON(places: Place[]) {
  return {
    type: "FeatureCollection" as const,
    features: places.map((p) => ({
      type: "Feature" as const,
      id: p.id,
      properties: {
        id: p.id,
        category: p.category,
        name: p.name,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng, p.lat] as [number, number],
      },
    })),
  };
}

type ClusterProps = {
  places: Place[];
  selectedId: number | null;
  markersInteractive: boolean;
  onSelect: (place: Place) => void;
};

export function TravelPlacesCluster({
  places,
  selectedId,
  markersInteractive,
  onSelect,
}: ClusterProps) {
  const { map, isLoaded } = useMap();
  const layersReady = useRef(false);
  const placesRef = useRef(places);
  placesRef.current = places;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const ensureLayers = useCallback(() => {
    if (!map || layersReady.current) return;
    if (!map.isStyleLoaded()) return;

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: placesToGeoJSON([]),
      cluster: true,
      clusterMaxZoom: 16,
      clusterRadius: 52,
      promoteId: "id",
    });

    map.addLayer({
      id: L_CLUSTERS,
      type: "circle",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(20, 184, 166, 0.92)",
        "circle-stroke-color": "rgba(255,255,255,0.9)",
        "circle-stroke-width": 2,
        "circle-radius": [
          "step",
          ["get", "point_count"],
          18,
          10,
          22,
          50,
          28,
        ],
      },
    });

    map.addLayer({
      id: L_CLUSTER_COUNT,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
      },
      paint: {
        "text-color": "#f4f4f5",
      },
    });

    map.addLayer({
      id: L_UNCLUSTERED,
      type: "circle",
      source: SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": categoryCircleColor as never,
        "circle-radius": 9,
        "circle-stroke-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          3.5,
          2,
        ],
        "circle-stroke-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          "#22d3ee",
          "#ffffff",
        ],
        "circle-opacity": 1,
      },
    });

    layersReady.current = true;
  }, [map]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const tryAdd = () => {
      ensureLayers();
    };

    if (map.isStyleLoaded()) tryAdd();
    else map.once("styledata", tryAdd);

    return () => {
      map.off("styledata", tryAdd);
      try {
        if (layersReady.current) {
          if (map.getLayer(L_CLUSTER_COUNT)) map.removeLayer(L_CLUSTER_COUNT);
          if (map.getLayer(L_CLUSTERS)) map.removeLayer(L_CLUSTERS);
          if (map.getLayer(L_UNCLUSTERED)) map.removeLayer(L_UNCLUSTERED);
          if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        }
      } catch {
        /* ignore */
      }
      layersReady.current = false;
    };
  }, [map, isLoaded, ensureLayers]);

  useEffect(() => {
    if (!map || !isLoaded || !layersReady.current) return;
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!src) return;
    src.setData(placesToGeoJSON(places));
  }, [map, isLoaded, places]);

  useEffect(() => {
    if (!map || !isLoaded || !layersReady.current) return;
    for (const p of placesRef.current) {
      try {
        map.setFeatureState(
          { source: SOURCE_ID, id: p.id },
          { selected: p.id === selectedId },
        );
      } catch {
        /* feature may not exist yet */
      }
    }
  }, [map, isLoaded, selectedId, places]);

  useEffect(() => {
    if (!map || !isLoaded || !layersReady.current) return;
    const vis = markersInteractive ? "visible" : "none";
    try {
      map.setLayoutProperty(L_CLUSTERS, "visibility", vis);
      map.setLayoutProperty(L_CLUSTER_COUNT, "visibility", vis);
      map.setLayoutProperty(L_UNCLUSTERED, "visibility", vis);
    } catch {
      /* ignore */
    }
  }, [map, isLoaded, markersInteractive]);

  useEffect(() => {
    if (!map || !isLoaded || !layersReady.current) return;

    const onClusterClick = async (e: MapLayerMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: [L_CLUSTERS] });
      if (!feats.length) return;
      const clusterId = feats[0].properties?.cluster_id as number;
      const src = map.getSource(SOURCE_ID) as GeoJSONSource;
      const zoom = await src.getClusterExpansionZoom(clusterId);
      const g = feats[0].geometry;
      if (!g || g.type !== "Point") return;
      const coords = g.coordinates as [number, number];
      map.easeTo({
        center: coords,
        zoom,
        duration: 500,
      });
    };

    const onPointClick = (e: MapLayerMouseEvent) => {
      if (!markersInteractive) return;
      const f = e.features?.[0];
      const raw = f?.properties?.id;
      if (raw === undefined || raw === null) return;
      const id = Number(raw);
      const place = placesRef.current.find((p) => p.id === id);
      if (place) onSelectRef.current(place);
    };

    const setPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const clearPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", L_CLUSTERS, onClusterClick);
    map.on("click", L_UNCLUSTERED, onPointClick);
    map.on("mouseenter", L_CLUSTERS, setPointer);
    map.on("mouseleave", L_CLUSTERS, clearPointer);
    map.on("mouseenter", L_UNCLUSTERED, setPointer);
    map.on("mouseleave", L_UNCLUSTERED, clearPointer);

    return () => {
      map.off("click", L_CLUSTERS, onClusterClick);
      map.off("click", L_UNCLUSTERED, onPointClick);
      map.off("mouseenter", L_CLUSTERS, setPointer);
      map.off("mouseleave", L_CLUSTERS, clearPointer);
      map.off("mouseenter", L_UNCLUSTERED, setPointer);
      map.off("mouseleave", L_UNCLUSTERED, clearPointer);
    };
  }, [map, isLoaded, markersInteractive]);

  return null;
}

type FocusProps = {
  places: Place[];
  focusKey: string;
};

export function TravelMapFocus({ places, focusKey }: FocusProps) {
  const { map, isLoaded } = useMap();
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (places.length === 0) {
      prevKey.current = focusKey;
      return;
    }
    if (prevKey.current === focusKey) return;
    prevKey.current = focusKey;

    const b = new maplibregl.LngLatBounds();
    for (const p of places) {
      b.extend([p.lng, p.lat]);
    }

    map.fitBounds(b, {
      padding: { top: 96, bottom: 96, left: 96, right: 96 },
      maxZoom: 12,
      duration: 1150,
      essential: true,
    });
  }, [map, isLoaded, places, focusKey]);

  return null;
}

type FlyProps = { place: Place | null };

export function TravelFlyToSelected({ place }: FlyProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !place) return;
    const z = Math.max(map.getZoom(), 13.25);
    map.flyTo({
      center: [place.lng, place.lat],
      zoom: z,
      duration: 950,
      essential: true,
    });
  }, [map, isLoaded, place]);

  return null;
}

type PickProps = {
  active: boolean;
  onPick: (lat: number, lng: number) => void;
};

export function TravelMapPick({ active, onPick }: PickProps) {
  const { map, isLoaded } = useMap();
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!map || !isLoaded) return;
    const el = map.getContainer();
    el.classList.toggle("pick-mode", active);
    return () => el.classList.remove("pick-mode");
  }, [map, isLoaded, active]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const handler = (e: { lngLat: { lat: number; lng: number } }) => {
      if (!active) return;
      onPickRef.current(e.lngLat.lat, e.lngLat.lng);
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, isLoaded, active]);

  return null;
}

type PreviewProps = { location: Coordinates | null };

export function TravelPreviewLocation({ location }: PreviewProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const ensure = () => {
      if (map.getSource(SRC_PREVIEW)) return;
      map.addSource(SRC_PREVIEW, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.addLayer({
        id: L_PREVIEW,
        type: "circle",
        source: SRC_PREVIEW,
        paint: {
          "circle-radius": 11,
          "circle-color": "#67e8f9",
          "circle-opacity": 0.88,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#22d3ee",
        },
      });
    };

    if (map.isStyleLoaded()) ensure();
    else map.once("styledata", ensure);

    return () => {
      map.off("styledata", ensure);
      try {
        if (map.getLayer(L_PREVIEW)) map.removeLayer(L_PREVIEW);
        if (map.getSource(SRC_PREVIEW)) map.removeSource(SRC_PREVIEW);
      } catch {
        /* ignore */
      }
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource(SRC_PREVIEW) as GeoJSONSource | undefined;
    if (!src) return;
    if (!location) {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [location.lng, location.lat],
          },
        },
      ],
    });
    const z = Math.max(map.getZoom(), 13);
    map.flyTo({
      center: [location.lng, location.lat],
      zoom: z,
      duration: 900,
      essential: true,
    });
  }, [map, isLoaded, location]);

  return null;
}
