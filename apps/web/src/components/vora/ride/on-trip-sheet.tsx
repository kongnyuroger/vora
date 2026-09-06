"use client";

import { useState } from "react";
import { AlertTriangle, HardHat, Share2, ShieldCheck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  RideStatus,
  RideType,
  Role,
  VerificationStatus,
  type RideDetail,
  type SafetyAlertPayload,
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
  onSos: () => void;
  safetyAlert: SafetyAlertPayload | null;
  onDismissSafetyAlert: () => void;
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
  onSos,
  safetyAlert,
  onDismissSafetyAlert,
}: OnTripSheetProps) {
  const t = useTranslations("Ride");
  const locale = useLocale();
  const isDriver = role === Role.DRIVER;
  const isTerminal =
    ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED;
  const [confirmingSos, setConfirmingSos] = useState(false);

  const handleShareTrip = () => {
    const url = `${window.location.origin}/${locale}/track/${ride.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSosConfirm = () => {
    setConfirmingSos(false);
    onSos();
  };

  return (
    <div className="flex flex-col gap-4">
      {safetyAlert?.rideId === ride.id && (
        <div className="flex items-center gap-3 rounded-card border border-vora-danger/30 bg-vora-danger/10 px-4 py-3 text-vora-danger">
          <AlertTriangle className="size-5 shrink-0" />
          <span className="flex-1 text-caption font-medium">
            {t("sosRegistered")}
          </span>
          <button
            type="button"
            onClick={onDismissSafetyAlert}
            aria-label={t("dismiss")}
            className="shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

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

      {!isTerminal &&
        (confirmingSos ? (
          <div className="flex items-center gap-2 rounded-card border border-vora-danger/30 bg-vora-danger/5 px-4 py-3">
            <span className="flex-1 text-caption font-medium text-vora-danger">
              {t("sosConfirmPrompt")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingSos(false)}
            >
              {t("sosConfirmCancel")}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleSosConfirm}>
              {t("sosConfirmYes")}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleShareTrip}
            >
              <Share2 data-icon="inline-start" />
              {t("shareTrip")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setConfirmingSos(true)}
            >
              <AlertTriangle data-icon="inline-start" />
              {t("sos")}
            </Button>
          </div>
        ))}

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
