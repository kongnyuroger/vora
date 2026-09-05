"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const YAOUNDE_CENTER: [number, number] = [11.5021, 3.848];
const DEFAULT_ZOOM = 12;
const FLY_ZOOM = 15;

export interface MapCanvasHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setPickup: (point: { lat: number; lng: number } | null) => void;
  setUserLocation: (point: { lat: number; lng: number } | null) => void;
}

export const MapCanvas = forwardRef<MapCanvasHandle>(function MapCanvas(
  _props,
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: YAOUNDE_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
