"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { RideType, type NearbyDriver, type RouteGeometry } from "@vora/shared";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Where the map opens before the rider shares a location. */
export const MAP_DEFAULT_CENTER = { lat: 3.848, lng: 11.5021 };
const YAOUNDE_CENTER: [number, number] = [
  MAP_DEFAULT_CENTER.lng,
  MAP_DEFAULT_CENTER.lat,
];
const DEFAULT_ZOOM = 12;
const FLY_ZOOM = 15;
const ROUTE_SOURCE_ID = "vora-route";
const ROUTE_LAYER_ID = "vora-route-line";
const EMPTY_LINE_STRING: RouteGeometry = { type: "LineString", coordinates: [] };

/** How long a driver marker takes to glide to a newly received location, rather than teleporting. */
const DRIVER_MOVE_MS = 1000;

export interface MapCanvasHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setPickup: (point: { lat: number; lng: number } | null) => void;
  setDropoff: (point: { lat: number; lng: number } | null) => void;
  setUserLocation: (point: { lat: number; lng: number } | null) => void;
  setDriverLocation: (point: { lat: number; lng: number } | null) => void;
  setNearbyDrivers: (drivers: NearbyDriver[]) => void;
  setRoute: (geometry: RouteGeometry | null) => void;
  fitToRoute: (geometry: RouteGeometry) => void;
}

export const MapCanvas = forwardRef<MapCanvasHandle>(function MapCanvas(
  _props,
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverAnimRef = useRef<number | null>(null);
  const nearbyMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: YAOUNDE_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    mapRef.current = map;

    const nearbyMarkers = nearbyMarkersRef.current;
    return () => {
      if (driverAnimRef.current) cancelAnimationFrame(driverAnimRef.current);
      nearbyMarkers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const applyRoute = (geometry: RouteGeometry) => {
    const map = mapRef.current;
    if (!map) return;

    const data: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry,
    };

    const source = map.getSource(ROUTE_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (source) {
      source.setData(data);
      return;
    }

    map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#0C7C59", "line-width": 4 },
    });
  };

  const withLoadedMap = (fn: () => void) => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) fn();
    else map.once("load", fn);
  };

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = FLY_ZOOM) => {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, speed: 1.2 });
    },
    setPickup: (point) => {
      if (!mapRef.current) return;

      if (!point) {
        pickupMarkerRef.current?.remove();
        pickupMarkerRef.current = null;
        return;
      }

      if (!pickupMarkerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = PICKUP_PIN_SVG;
        pickupMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([point.lng, point.lat])
          .addTo(mapRef.current);
      } else {
        pickupMarkerRef.current.setLngLat([point.lng, point.lat]);
      }
    },
    setDropoff: (point) => {
      if (!mapRef.current) return;

      if (!point) {
        dropoffMarkerRef.current?.remove();
        dropoffMarkerRef.current = null;
        return;
      }

      if (!dropoffMarkerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = DROPOFF_PIN_SVG;
        dropoffMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([point.lng, point.lat])
          .addTo(mapRef.current);
      } else {
        dropoffMarkerRef.current.setLngLat([point.lng, point.lat]);
      }
    },
    setNearbyDrivers: (drivers) => {
      const map = mapRef.current;
      if (!map) return;

      const markers = nearbyMarkersRef.current;
      const seen = new Set<string>();

      for (const driver of drivers) {
        seen.add(driver.userId);
        const existing = markers.get(driver.userId);
        if (existing) {
          existing.setLngLat([driver.lng, driver.lat]);
          continue;
        }

        const el = document.createElement("div");
        el.className = "vora-nearby-driver";
        el.innerHTML = driver.rideTypes.includes(RideType.MOTO)
          ? NEARBY_MOTO_SVG
          : NEARBY_CAR_SVG;
        markers.set(
          driver.userId,
          new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([driver.lng, driver.lat])
            .addTo(map),
        );
      }

      for (const [userId, marker] of markers) {
        if (!seen.has(userId)) {
          marker.remove();
          markers.delete(userId);
        }
      }
    },
    setRoute: (geometry) => {
      withLoadedMap(() => applyRoute(geometry ?? EMPTY_LINE_STRING));
    },
    fitToRoute: (geometry) => {
      if (geometry.coordinates.length === 0) return;
      withLoadedMap(() => {
        const bounds = geometry.coordinates.reduce(
          (b, [lng, lat]) => b.extend([lng, lat]),
          new mapboxgl.LngLatBounds(
            geometry.coordinates[0],
            geometry.coordinates[0],
          ),
        );
        mapRef.current?.fitBounds(bounds, { padding: 64, maxZoom: 16 });
      });
    },
    setUserLocation: (point) => {
      if (!mapRef.current) return;

      if (!point) {
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        return;
      }

      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "vora-user-dot";
        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([point.lng, point.lat])
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLngLat([point.lng, point.lat]);
      }
    },
    setDriverLocation: (point) => {
      if (!mapRef.current) return;

      if (driverAnimRef.current) {
        cancelAnimationFrame(driverAnimRef.current);
        driverAnimRef.current = null;
      }

      if (!point) {
        driverMarkerRef.current?.remove();
        driverMarkerRef.current = null;
        return;
      }

      if (!driverMarkerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = DRIVER_PIN_SVG;
        driverMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([point.lng, point.lat])
          .addTo(mapRef.current);
        return;
      }

      // Glide to the new fix instead of teleporting — GPS updates arrive
      // sparsely, so this is what makes the marker read as "driving".
      const marker = driverMarkerRef.current;
      const from = marker.getLngLat();
      const to: [number, number] = [point.lng, point.lat];
      const startTime = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / DRIVER_MOVE_MS);
        marker.setLngLat([
          from.lng + (to[0] - from.lng) * t,
          from.lat + (to[1] - from.lat) * t,
        ]);
        driverAnimRef.current = t < 1 ? requestAnimationFrame(step) : null;
      };

      driverAnimRef.current = requestAnimationFrame(step);
    },
  }));

  return (
    <>
      {/*
        Mapbox GL adds its own "mapboxgl-map" class (position: relative)
        directly onto the container element. At equal specificity that
        can beat our own "absolute inset-0" utilities depending on CSS
        load order, collapsing the map to zero height. So Mapbox gets an
        inner div to mutate, and our own positioning stays on an
        untouched wrapper.
      */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
        {/* Without a token Mapbox fails silently to a black rectangle, which
            looks like a broken app rather than a missing env var. */}
        {!MAPBOX_TOKEN && (
          <div className="absolute inset-0 flex items-center justify-center bg-vora-ink px-8 text-center">
            <p className="text-caption text-white/70">
              Map unavailable — NEXT_PUBLIC_MAPBOX_TOKEN is not set.
            </p>
          </div>
        )}
      </div>
      <style jsx global>{`
        .vora-user-dot {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #0c7c59;
          border: 3px solid #ffffff;
          box-shadow:
            0 0 0 4px rgba(12, 124, 89, 0.3),
            0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .vora-nearby-driver {
          opacity: 0.85;
          transition: opacity 200ms ease;
        }
        .mapboxgl-ctrl-attrib.mapboxgl-compact {
          opacity: 0.6;
        }
      `}</style>
    </>
  );
});

const PICKUP_PIN_SVG = `
<svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#F6A609"/>
  <circle cx="18" cy="18" r="7" fill="#0E1420"/>
</svg>
`;

const DROPOFF_PIN_SVG = `
<svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="#0C7C59"/>
  <circle cx="18" cy="18" r="7" fill="#FFFFFF"/>
</svg>
`;

/* Smaller and quieter than the assigned-driver pin — ambient presence, not the driver you booked. */
const NEARBY_MOTO_SVG = `
<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
  <circle cx="13" cy="13" r="11" fill="#0E1420" stroke="#F6A609" stroke-width="1.5"/>
  <circle cx="9" cy="16" r="2.2" stroke="#F6A609" stroke-width="1.3" fill="none"/>
  <circle cx="17" cy="16" r="2.2" stroke="#F6A609" stroke-width="1.3" fill="none"/>
  <path d="M9 16l3-4h4l1 4" stroke="#F6A609" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const NEARBY_CAR_SVG = `
<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
  <circle cx="13" cy="13" r="11" fill="#0E1420" stroke="#0C7C59" stroke-width="1.5"/>
  <path d="M7.5 15.5l1-3.4a1.4 1.4 0 0 1 1.35-1h6.3a1.4 1.4 0 0 1 1.35 1l1 3.4" stroke="#1FA971" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="9.5" cy="15.8" r="1.3" fill="#1FA971"/>
  <circle cx="16.5" cy="15.8" r="1.3" fill="#1FA971"/>
</svg>
`;

const DRIVER_PIN_SVG = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="#0E1420" stroke="#FFFFFF" stroke-width="3"/>
  <path d="M13 24.5l1.4-6.2a2 2 0 0 1 1.95-1.55h7.3a2 2 0 0 1 1.95 1.55l1.4 6.2" stroke="#F6A609" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="15.5" cy="24.5" r="1.8" fill="#F6A609"/>
  <circle cx="24.5" cy="24.5" r="1.8" fill="#F6A609"/>
</svg>
`;
