"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Flag, LogOut, MapPin, Power, ShieldCheck } from "lucide-react";
import { Role } from "@vora/shared";
import { Button } from "@/components/ui/button";
import { BottomSheet, type SheetSnap } from "@/components/vora/bottom-sheet";
import type { MapCanvasHandle } from "@/components/vora/map/map-canvas";
import { OnTripSheet } from "@/components/vora/ride/on-trip-sheet";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth-store";
import { useRideStore } from "@/stores/ride-store";
import { useWatchPosition } from "@/hooks/use-watch-position";
import { formatDurationMin, formatXaf } from "@/lib/utils";

const MapCanvas = dynamic(
  () => import("@/components/vora/map/map-canvas").then((m) => m.MapCanvas),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-vora-ink" /> },
);

const LOCALES: { code: AppLocale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "pcm", label: "Pidgin" },
];

/** Auto-dismiss an unanswered ride request so a stale card doesn't linger forever. */
const REQUEST_TIMEOUT_MS = 25000;

export function DriverHomeScreen() {
  const tHome = useTranslations("Home");
  const tSession = useTranslations("Auth.session");
  const tDriver = useTranslations("Driver");
  const tRideTypes = useTranslations("RideTypes");
  const [snap, setSnap] = useState<SheetSnap>("half");

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);

  const isOnline = useRideStore((s) => s.isOnline);
  const activeRide = useRideStore((s) => s.activeRide);
  const incomingRequest = useRideStore((s) => s.incomingRequest);
  const connectRideSocket = useRideStore((s) => s.connect);
  const goOnline = useRideStore((s) => s.goOnline);
  const goOffline = useRideStore((s) => s.goOffline);
  const sendLocation = useRideStore((s) => s.sendLocation);
  const acceptRide = useRideStore((s) => s.acceptRide);
  const dismissIncomingRequest = useRideStore((s) => s.dismissIncomingRequest);
  const markArrived = useRideStore((s) => s.markArrived);
  const startTrip = useRideStore((s) => s.startTrip);
  const completeTrip = useRideStore((s) => s.completeTrip);
  const cancelRide = useRideStore((s) => s.cancelRide);
  const setActiveRide = useRideStore((s) => s.setActiveRide);

  const mapRef = useRef<MapCanvasHandle>(null);
  const { status: geoStatus, position, start, stop } = useWatchPosition();

  useEffect(() => {
    if (accessToken) connectRideSocket(accessToken);
  }, [accessToken, connectRideSocket]);

  useEffect(() => {
    if (!position) return;
    mapRef.current?.setUserLocation(position);
    if (isOnline) sendLocation(position.lat, position.lng);
  }, [position, isOnline, sendLocation]);

  useEffect(() => {
    if (position) mapRef.current?.flyTo(position.lat, position.lng, 15);
    // Only recenter the very first time a fix arrives — not on every update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!position]);

  useEffect(() => {
    if (!incomingRequest) return;
    const timer = setTimeout(dismissIncomingRequest, REQUEST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [incomingRequest, dismissIncomingRequest]);

  useEffect(() => {
    if (!activeRide) {
      mapRef.current?.setPickup(null);
      mapRef.current?.setDropoff(null);
      return;
    }
    mapRef.current?.setPickup({
      lat: activeRide.pickupLat,
      lng: activeRide.pickupLng,
    });
    mapRef.current?.setDropoff({
      lat: activeRide.dropoffLat,
      lng: activeRide.dropoffLng,
    });
  }, [activeRide]);

  const handleGoOnline = () => {
    start();
  };

  useEffect(() => {
    if (geoStatus === "watching" && position && !isOnline) {
      goOnline(position.lat, position.lng);
    }
    // Fires once, right after the first fix arrives from a Go Online tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoStatus, !!position]);

  const handleGoOffline = () => {
    stop();
    goOffline();
  };

  const handleDone = () => {
    setActiveRide(null);
    setSnap("half");
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-vora-ink">
      <MapCanvas ref={mapRef} />

      <div className="relative z-50 flex items-center justify-between px-5 pt-6">
        <span className="font-heading text-h2 font-bold tracking-tight text-white">
          {tHome("title")}
        </span>
        <nav className="flex gap-1 rounded-full bg-white/10 p-1 backdrop-blur-sm">
          {LOCALES.map((l) => (
            <Link
              key={l.code}
              href="/"
              locale={l.code}
              className="rounded-full px-3 py-1 text-caption font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {user && (
        <div className="relative z-50 mt-4 flex items-center justify-between px-6">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 py-1.5 pl-2.5 pr-3 text-caption text-white/85 backdrop-blur-sm">
            <ShieldCheck className="size-3.5 text-vora-amber" />
            <span>
              {tSession("loggedInAs", { phone: user.phone })} ·{" "}
              {tSession("driver")}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label={tSession("logout")}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-caption font-medium text-white/85 backdrop-blur-sm transition-colors hover:bg-white/15"
          >
            <LogOut className="size-3.5" />
            {tSession("logout")}
          </button>
        </div>
      )}

      <BottomSheet snap={snap} onSnapChange={setSnap} snaps={["half", "full"]}>
        {activeRide ? (
          <OnTripSheet
            ride={activeRide}
            role={Role.DRIVER}
            onArrived={() => markArrived(activeRide.id)}
            onStart={() => startTrip(activeRide.id)}
            onComplete={() => completeTrip(activeRide.id)}
            onCancel={() => cancelRide(activeRide.id)}
            onDone={handleDone}
          />
        ) : incomingRequest ? (
          <div className="flex flex-col gap-4">
            <span className="text-body font-semibold text-secondary-foreground">
              {tDriver("incomingRequestTitle")}
            </span>

            <div className="flex flex-col gap-2 rounded-card border border-border bg-secondary px-4 py-3.5">
              <div className="flex items-center gap-2 text-caption text-secondary-foreground/80">
                <MapPin className="size-4 shrink-0 text-vora-amber" />
                <span className="truncate">{incomingRequest.pickupLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-caption text-secondary-foreground/80">
                <Flag className="size-4 shrink-0 text-vora-green" />
                <span className="truncate">{incomingRequest.dropoffLabel}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2">
                <span className="text-caption text-secondary-foreground/70">
                  {tRideTypes(incomingRequest.rideType.toLowerCase())} ·{" "}
                  {formatDurationMin(incomingRequest.durationS)}
                </span>
                <span className="text-body font-semibold text-secondary-foreground">
                  {formatXaf(incomingRequest.fareXaf)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={dismissIncomingRequest}
              >
                {tDriver("decline")}
              </Button>
              <Button
                size="cta"
                className="flex-1"
                onClick={() => acceptRide(incomingRequest.id)}
              >
                {tDriver("accept")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span
              className={
                isOnline
                  ? "flex size-14 items-center justify-center rounded-full bg-vora-green text-white"
                  : "flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
              }
            >
              <Power className="size-6" />
            </span>

            <div>
              <p className="text-body font-semibold text-secondary-foreground">
                {isOnline ? tDriver("onlineStatus") : tDriver("offlineStatus")}
              </p>
              <p className="text-caption text-muted-foreground">
                {isOnline
                  ? tDriver("waitingForRequests")
                  : tDriver("goOnlinePrompt")}
              </p>
            </div>

            {geoStatus === "denied" && (
              <p className="text-caption text-destructive">
                {tDriver("locationRequired")}
              </p>
            )}

            <Button
              size="cta"
              className="w-full"
              variant={isOnline ? "outline" : "default"}
              onClick={isOnline ? handleGoOffline : handleGoOnline}
            >
              {isOnline ? tDriver("goOffline") : tDriver("goOnline")}
            </Button>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}
