"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { PaymentStatus, type Payment, type PaymentMethod } from "@vora/shared";
import { Button } from "@/components/ui/button";
import { refreshRidePayment } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useRideStore } from "@/stores/ride-store";
import { formatXaf } from "@/lib/utils";

interface PaymentSummaryProps {
  rideId: string;
  method: PaymentMethod;
  amountXaf: number;
}

/** Matches the public tracking page's cadence — smooth without hammering the provider. */
const POLL_MS = 4000;

export function PaymentSummary({
  rideId,
  method,
  amountXaf,
}: PaymentSummaryProps) {
  const t = useTranslations("Payment");
  const token = useAuthStore((s) => s.accessToken);
  const payment = useRideStore((s) => s.payment);
  const setPayment = useRideStore((s) => s.setPayment);
  const [isChecking, setIsChecking] = useState(false);

  const settlement: Payment | null =
    payment?.rideId === rideId ? payment : null;
  const isPending = !settlement || settlement.status === PaymentStatus.PENDING;

  const check = useCallback(async () => {
    if (!token) return;
    setIsChecking(true);
    try {
      setPayment(await refreshRidePayment(rideId, token));
    } catch {
      // Leave the last known status on screen — a failed poll is not a
      // failed payment, and the next tick will try again.
    } finally {
      setIsChecking(false);
    }
  }, [rideId, token, setPayment]);

  useEffect(() => {
    if (!settlement || settlement.status !== PaymentStatus.PENDING) return;
    const timer = setInterval(() => void check(), POLL_MS);
    return () => clearInterval(timer);
  }, [settlement, check]);

  const methodLabel = t(`method.${method}`);

  if (isPending) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-vora-amber/40 bg-vora-amber-100 px-4 py-3.5">
        <Loader2 className="size-5 shrink-0 animate-spin text-vora-green-700" />
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold text-vora-green-700">
            {t("awaitingPayment")}
          </span>
          <span className="block truncate text-caption text-vora-green-700/80">
            {t("awaitingHint", { method: methodLabel })}
          </span>
        </span>
        {settlement && (
          <Button
            size="sm"
            variant="outline"
            disabled={isChecking}
            onClick={() => void check()}
          >
            {t("checkStatus")}
          </Button>
        )}
      </div>
    );
  }

  if (settlement.status === PaymentStatus.FAILED) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-vora-danger/30 bg-vora-danger/10 px-4 py-3.5 text-vora-danger">
        <AlertTriangle className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold">
            {t("paymentFailed")}
          </span>
          <span className="block text-caption opacity-90">
            {settlement.failureReason ?? t("collectCash")}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-card border border-vora-green/30 bg-vora-green-100 px-4 py-3.5">
      <CheckCircle2 className="size-5 shrink-0 text-vora-green" />
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-vora-green-700">
          {t("paid", { amount: formatXaf(amountXaf) })}
        </span>
        <span className="block truncate text-caption text-vora-green-700/80">
          {methodLabel}
        </span>
      </span>
    </div>
  );
}
