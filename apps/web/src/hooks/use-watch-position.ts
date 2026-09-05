"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoPosition } from "./use-geolocation";

type WatchStatus = "idle" | "watching" | "denied" | "error";

/** Continuous geolocation for driver mode — unlike useGeolocation's one-shot fix, this streams updates via watchPosition. */
export function useWatchPosition() {
  const [status, setStatus] = useState<WatchStatus>("idle");
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    if (watchIdRef.current !== null) return;

    setStatus("watching");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("watching");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
  }, []);

  useEffect(() => stop, [stop]);

  return { status, position, start, stop };
}
