"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Flag, HardHat, MapPin, ShieldCheck } from "lucide-react";
import { RideType, VerificationStatus } from "@vora/shared";
import type { MapCanvasHandle } from "@/components/vora/map/map-canvas";
import { getPublicRide } from "@/lib/api";

const MapCanvas = dynamic(
  () => import("@/components/vora/map/map-canvas").then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-vora-ink" />,
  },
);

/** Public share-link viewers poll rather than hold an authenticated socket connection. */
const POLL_INTERVAL_MS = 4000;

export function TrackScreen({ rideId }: { rideId: string }) {
  const t = useTranslations("Track");
  const tRide = useTranslations("Ride");
  const tRideTypes = useTranslations("RideTypes");
  const mapRef = useRef<MapCanvasHandle>(null);

  const { data: ride, isLoading, isError } = useQuery({
    queryKey: ["publicRide", rideId],
    queryFn: () => getPublicRide(rideId),
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  });

  useEffect(() => {
    if (!ride) return;
    mapRef.current?.setPickup({ lat: ride.pickupLat, lng: ride.pickupLng });
    mapRef.current?.setDropoff({ lat: ride.dropoffLat, lng: ride.dropoffLng });
    mapRef.current?.fitToRoute({
      type: "LineString",
      coordinates: [
        [ride.pickupLng, ride.pickupLat],
        [ride.dropoffLng, ride.dropoffLat],
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.pickupLat, ride?.pickupLng, ride?.dropoffLat, ride?.dropoffLng]);

  useEffect(() => {
    if (!ride) return;
    mapRef.current?.setDriverLocation(
      ride.driverLat != null && ride.driverLng != null
        ? { lat: ride.driverLat, lng: ride.driverLng }
        : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.driverLat, ride?.driverLng]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-vora-ink">
      <MapCanvas ref={mapRef} />

      <div className="relative z-50 flex flex-col gap-1 px-5 pt-6">
        <span className="font-heading text-h2 font-bold tracking-tight text-white">
          VORA
        </span>
        <span className="text-caption text-white/70">{t("subtitle")}</span>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-4 rounded-t-sheet bg-card px-5 py-6 shadow-vora-sheet">
        {isLoading && (
          <p className="text-body text-muted-foreground">{t("loading")}</p>
        )}

        {isError && (
          <p className="text-body text-destructive">{t("notFound")}</p>
        )}

        {ride && (
          <>
            <span className="text-body font-semibold text-secondary-foreground">
              {tRide(`status.${ride.status}`)}
            </span>

            <div className="flex flex-col gap-2 rounded-card border border-border bg-secondary px-4 py-3.5">
              <div className="flex items-center gap-2 text-caption text-secondary-foreground/80">
                <MapPin className="size-4 shrink-0 text-vora-amber" />
                <span className="truncate">{ride.pickupLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-caption text-secondary-foreground/80">
                <Flag className="size-4 shrink-0 text-vora-green" />
                <span className="truncate">{ride.dropoffLabel}</span>
              </div>
              <div className="mt-1 border-t border-border/60 pt-2 text-caption text-secondary-foreground/70">
                {tRideTypes(ride.rideType.toLowerCase())}
              </div>
            </div>

            {ride.driver && (
              <div className="flex items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5 shadow-vora-soft">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-vora-green text-white">
                  <ShieldCheck className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-body font-semibold text-secondary-foreground">
                    {ride.driver.name ?? tRide("driverFallbackName")}
                    {ride.driver.verification === VerificationStatus.VERIFIED && (
                      <span className="flex items-center gap-0.5 text-caption font-medium text-vora-green">
                        <ShieldCheck className="size-3.5" />
                        {t("verified")}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-caption text-secondary-foreground/70">
                    {ride.driver.vehicleModel} · {ride.driver.color} ·{" "}
                    {ride.driver.plateNumber}
                  </span>
                </span>
                {ride.driver.helmetProvided && ride.rideType === RideType.MOTO && (
                  <HardHat className="size-5 shrink-0 text-vora-amber" />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
