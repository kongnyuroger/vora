"use client";

import { HardHat, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  RideStatus,
  RideType,
  Role,
  VerificationStatus,
  type RideDetail,
} from "@vora/shared";
import { Button } from "@/components/ui/button";
import { formatXaf } from "@/lib/utils";

interface OnTripSheetProps {
  ride: RideDetail;
  role: Role;
  onArrived: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDone: () => void;
}

const CANCELLABLE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.SEARCHING,
  RideStatus.ACCEPTED,
  RideStatus.ARRIVING,
  RideStatus.ARRIVED,
];

export function OnTripSheet({
  ride,
  role,
  onArrived,
  onStart,
  onComplete,
  onCancel,
  onDone,
}: OnTripSheetProps) {
  const t = useTranslations("Ride");
  const isDriver = role === Role.DRIVER;
  const isTerminal =
    ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-body font-semibold text-secondary-foreground">
          {t(`status.${ride.status}`)}
        </span>
        {!isTerminal && (
          <span className="rounded-full bg-vora-amber-100 px-3 py-1 text-caption font-medium text-vora-green-700">
            {t("pin")} · {ride.startPin}
          </span>
        )}
      </div>

      {!isDriver && ride.driver && (
        <div className="flex items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5 shadow-vora-soft">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-vora-green text-white">
            <ShieldCheck className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-body font-semibold text-secondary-foreground">
              {ride.driver.name ?? t("driverFallbackName")}
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

      <div className="flex items-center justify-between rounded-card border border-border bg-secondary px-4 py-3.5">
        <span className="text-caption text-secondary-foreground/70">
          {t("fare")}
        </span>
        <span className="text-body font-semibold text-secondary-foreground">
          {formatXaf(ride.fareXaf)}
        </span>
      </div>

      {isDriver && ride.status === RideStatus.ARRIVING && (
        <Button size="cta" className="w-full" onClick={onArrived}>
          {t("arrivedButton")}
        </Button>
      )}
      {isDriver && ride.status === RideStatus.ARRIVED && (
        <Button size="cta" className="w-full" onClick={onStart}>
          {t("startTripButton")}
        </Button>
      )}
      {isDriver && ride.status === RideStatus.IN_PROGRESS && (
        <Button size="cta" className="w-full" onClick={onComplete}>
          {t("completeTripButton")}
        </Button>
      )}

      {!isTerminal && CANCELLABLE_STATUSES.includes(ride.status) && (
        <button
          type="button"
          onClick={onCancel}
          className="self-center text-caption font-medium text-destructive"
        >
          {t("cancel")}
        </button>
      )}

      {isTerminal && (
        <Button size="cta" className="w-full" onClick={onDone}>
          {ride.status === RideStatus.COMPLETED
            ? isDriver
              ? t("doneDriver")
              : t("done")
            : t("ok")}
        </Button>
      )}
    </div>
  );
}
