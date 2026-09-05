"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Flag, Locate, LogOut, Search, ShieldCheck } from "lucide-react";
import { RideType, Role, type LandmarkSearchResult } from "@vora/shared";
import { BottomSheet, type SheetSnap } from "@/components/vora/bottom-sheet";
import { LandmarkSearch } from "@/components/vora/map/landmark-search";
import type { MapCanvasHandle } from "@/components/vora/map/map-canvas";
import { RideTypeCarousel } from "@/components/vora/ride/ride-type-carousel";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth-store";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getFareQuote } from "@/lib/api";
import { cn } from "@/lib/utils";

const MapCanvas = dynamic(
  () => import("@/components/vora/map/map-canvas").then((m) => m.MapCanvas),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-vora-ink" /> },
);

interface HomeScreenCopy {
  title: string;
  tagline: string;
  cta: string;
  scaffoldNotice: string;
}

const LOCALES: { code: AppLocale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "pcm", label: "Pidgin" },
];

export function HomeScreen({ copy }: { copy: HomeScreenCopy }) {
  const tSession = useTranslations("Auth.session");
  const tMap = useTranslations("Map");
  const tFare = useTranslations("Fare");
  const [snap, setSnap] = useState<SheetSnap>("peek");
  const [pickup, setPickup] = useState<LandmarkSearchResult | null>(null);
  const [dropoff, setDropoff] = useState<LandmarkSearchResult | null>(null);
  const [selectedRideType, setSelectedRideType] = useState<RideType>(
    RideType.MOTO,
  );
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const mapRef = useRef<MapCanvasHandle>(null);
  const { status: geoStatus, position: userPosition, requestLocation } =
    useGeolocation();

  useEffect(() => {
    if (userPosition) {
      mapRef.current?.setUserLocation(userPosition);
      mapRef.current?.flyTo(userPosition.lat, userPosition.lng, 15);
    }
  }, [userPosition]);

  const {
    data: fareQuote,
    isFetching: isQuoting,
    isError: isQuoteError,
  } = useQuery({
    queryKey: [
      "fareQuote",
      pickup?.lat,
      pickup?.lng,
      dropoff?.lat,
      dropoff?.lng,
    ],
    queryFn: () =>
      getFareQuote({
        pickupLat: pickup!.lat,
        pickupLng: pickup!.lng,
        dropoffLat: dropoff!.lat,
        dropoffLng: dropoff!.lng,
      }),
    enabled: !!pickup && !!dropoff,
  });

  useEffect(() => {
    if (fareQuote) {
      mapRef.current?.setRoute(fareQuote.route);
      mapRef.current?.fitToRoute(fareQuote.route);
    }
  }, [fareQuote]);

  const roleLabel =
    user?.role === Role.DRIVER ? tSession("driver") : tSession("rider");

  const handleSelectPickup = (result: LandmarkSearchResult) => {
    setPickup(result);
    mapRef.current?.setPickup({ lat: result.lat, lng: result.lng });
    mapRef.current?.flyTo(result.lat, result.lng, 15);
    setSnap("half");
  };

  const handleSelectDropoff = (result: LandmarkSearchResult) => {
    setDropoff(result);
    mapRef.current?.setDropoff({ lat: result.lat, lng: result.lng });
    setSnap("half");
  };

  const clearPickup = () => {
    setPickup(null);
    setDropoff(null);
    mapRef.current?.setPickup(null);
    mapRef.current?.setDropoff(null);
    mapRef.current?.setRoute(null);
    setSnap("full");
  };

  const clearDropoff = () => {
    setDropoff(null);
    mapRef.current?.setDropoff(null);
    mapRef.current?.setRoute(null);
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-vora-ink">
      <MapCanvas ref={mapRef} />

      <div className="relative z-50 flex items-center justify-between px-5 pt-6">
        <span className="font-heading text-h2 font-bold tracking-tight text-white">
          {copy.title}
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
              {tSession("loggedInAs", { phone: user.phone })} · {roleLabel}
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

      {snap === "peek" && (
        <button
          type="button"
          onClick={requestLocation}
          aria-label={tMap("useMyLocation")}
          className="fixed right-4 z-45 flex size-12 items-center justify-center rounded-full bg-card text-vora-green shadow-vora-soft transition-transform active:scale-95"
          style={{ bottom: "calc(18dvh + 16px)" }}
        >
          <Locate
            className={cn("size-5", geoStatus === "locating" && "animate-pulse")}
          />
        </button>
      )}

      <BottomSheet snap={snap} onSnapChange={setSnap}>
        <div className="flex flex-col gap-4">
          {pickup ? (
            <div className="flex items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5 shadow-vora-soft">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-vora-amber-100">
                <ShieldCheck className="size-4 text-vora-green-700" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption text-secondary-foreground/70">
                  {tMap("pickupLabel")}
                </span>
                <span className="block truncate text-body font-medium text-secondary-foreground">
                  {pickup.name}
                </span>
              </span>
              <button
                type="button"
                onClick={clearPickup}
                className="shrink-0 rounded-full px-3 py-1.5 text-caption font-medium text-vora-green"
              >
                {tMap("change")}
              </button>
            </div>
          ) : snap === "peek" ? (
            <button
              type="button"
              onClick={() => setSnap("full")}
              className="flex w-full items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5 text-left text-body font-medium text-secondary-foreground shadow-vora-soft transition-transform active:scale-[0.98]"
            >
              <Search className="size-5 shrink-0 text-vora-green" />
              {copy.cta}
            </button>
          ) : (
            <LandmarkSearch
              proximity={userPosition ?? undefined}
              onSelect={handleSelectPickup}
            />
          )}

          {pickup && dropoff && (
            <div className="flex items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5 shadow-vora-soft">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-vora-green-100">
                <Flag className="size-4 text-vora-green-700" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-caption text-secondary-foreground/70">
                  {tMap("dropoffLabel")}
                </span>
                <span className="block truncate text-body font-medium text-secondary-foreground">
                  {dropoff.name}
                </span>
              </span>
              <button
                type="button"
                onClick={clearDropoff}
                className="shrink-0 rounded-full px-3 py-1.5 text-caption font-medium text-vora-green"
              >
                {tMap("change")}
              </button>
            </div>
          )}

          {pickup && !dropoff && (
            <LandmarkSearch
              proximity={pickup}
              placeholder={tMap("destinationPlaceholder")}
              onSelect={handleSelectDropoff}
            />
          )}

          {pickup && dropoff && isQuoting && (
            <p className="text-caption text-muted-foreground">
              {tFare("loadingQuote")}
            </p>
          )}

          {pickup && dropoff && isQuoteError && (
            <p className="text-caption text-destructive">
              {tFare("quoteError")}
            </p>
          )}

          {pickup && dropoff && fareQuote && (
            <RideTypeCarousel
              quotes={fareQuote.quotes}
              selected={selectedRideType}
              onSelect={setSelectedRideType}
            />
          )}

          {geoStatus === "denied" && (
            <p className="text-caption text-destructive">
              {tMap("locationDenied")}
            </p>
          )}

          {snap === "peek" && !pickup && (
            <p className="text-caption text-muted-foreground">
              {copy.tagline}
            </p>
          )}
        </div>
      </BottomSheet>
    </main>
  );
}
