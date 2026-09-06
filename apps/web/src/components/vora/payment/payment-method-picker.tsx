"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Banknote, Loader2, Smartphone, Wallet } from "lucide-react";
import {
  MOMO_METHODS,
  PaymentMethod,
  PaymentStatus,
  TOPUP_PRESETS_XAF,
} from "@vora/shared";
import { Button } from "@/components/ui/button";
import { getWallet, topUpWallet } from "@/lib/api";
import { cn, formatXaf } from "@/lib/utils";

interface PaymentMethodPickerProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  /** Fare being booked — used to warn when the wallet can't cover it. */
  fareXaf: number;
  token: string;
}

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  [PaymentMethod.CASH]: Banknote,
  [PaymentMethod.MOMO_MTN]: Smartphone,
  [PaymentMethod.MOMO_ORANGE]: Smartphone,
  [PaymentMethod.WALLET]: Wallet,
};

const METHOD_ORDER: PaymentMethod[] = [
  PaymentMethod.CASH,
  PaymentMethod.MOMO_MTN,
  PaymentMethod.MOMO_ORANGE,
  PaymentMethod.WALLET,
];

/** Poll while a top-up sits PENDING — the subscriber is approving on their handset. */
const TOPUP_POLL_MS = 3000;

export function PaymentMethodPicker({
  selected,
  onSelect,
  fareXaf,
  token,
}: PaymentMethodPickerProps) {
  const t = useTranslations("Payment");
  const queryClient = useQueryClient();
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(TOPUP_PRESETS_XAF[0]);
  const [topupMethod, setTopupMethod] = useState<PaymentMethod>(
    PaymentMethod.MOMO_MTN,
  );

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet(token),
    refetchInterval: (query) =>
      query.state.data?.transactions.some(
        (tx) => tx.status === PaymentStatus.PENDING,
      )
        ? TOPUP_POLL_MS
        : false,
  });

  const topup = useMutation({
    mutationFn: () =>
      topUpWallet(
        {
          amountXaf: topupAmount,
          method: topupMethod as
            | PaymentMethod.MOMO_MTN
            | PaymentMethod.MOMO_ORANGE,
        },
        token,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallet"] }),
  });

  const balanceXaf = wallet?.balanceXaf ?? 0;
  const walletShort =
    selected === PaymentMethod.WALLET && balanceXaf < fareXaf;
  const topupPending = topup.data?.transaction.status === PaymentStatus.PENDING;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption font-medium text-muted-foreground">
        {t("payWith")}
      </span>

      <div className="grid grid-cols-2 gap-2">
        {METHOD_ORDER.map((method) => {
          const Icon = METHOD_ICON[method];
          const isSelected = method === selected;

          return (
            <button
              key={method}
              type="button"
              onClick={() => onSelect(method)}
              aria-pressed={isSelected}
              className={cn(
                "flex items-center gap-2 rounded-card border px-3 py-2.5 text-left transition-colors active:scale-[0.98]",
                isSelected
                  ? "border-vora-green bg-vora-green-100"
                  : "border-border bg-secondary",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-vora-green-700" : "text-vora-green",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-caption font-medium text-secondary-foreground">
                  {t(`method.${method}`)}
                </span>
                {method === PaymentMethod.WALLET && (
                  <span className="block truncate text-[11px] text-secondary-foreground/70">
                    {formatXaf(balanceXaf)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {walletShort && !showTopup && (
        <div className="flex items-center gap-2 rounded-card border border-vora-amber/40 bg-vora-amber-100 px-3 py-2.5">
          <span className="flex-1 text-caption text-vora-green-700">
            {t("walletShort", { amount: formatXaf(fareXaf - balanceXaf) })}
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowTopup(true)}>
            {t("topUp")}
          </Button>
        </div>
      )}

      {selected === PaymentMethod.WALLET && !walletShort && !showTopup && (
        <button
          type="button"
          onClick={() => setShowTopup(true)}
          className="self-start text-caption font-medium text-vora-green"
        >
          {t("topUp")}
        </button>
      )}

      {showTopup && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-secondary px-4 py-3.5">
          <span className="text-caption font-medium text-secondary-foreground">
            {t("topUpTitle")}
          </span>

          <div className="flex flex-wrap gap-2">
            {TOPUP_PRESETS_XAF.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setTopupAmount(amount)}
                aria-pressed={amount === topupAmount}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-caption font-medium transition-colors",
                  amount === topupAmount
                    ? "border-vora-green bg-vora-green text-white"
                    : "border-border bg-card text-secondary-foreground",
                )}
              >
                {formatXaf(amount)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {MOMO_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setTopupMethod(method)}
                aria-pressed={method === topupMethod}
                className={cn(
                  "flex-1 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors",
                  method === topupMethod
                    ? "border-vora-green bg-vora-green-100 text-vora-green-700"
                    : "border-border bg-card text-secondary-foreground",
                )}
              >
                {t(`method.${method}`)}
              </button>
            ))}
          </div>

          {topupPending && (
            <p className="flex items-center gap-2 text-caption text-vora-green-700">
              <Loader2 className="size-3.5 animate-spin" />
              {t("topUpPending")}
            </p>
          )}
          {topup.isError && (
            <p className="text-caption text-destructive">{t("topUpFailed")}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowTopup(false)}
            >
              {t("close")}
            </Button>
            <Button
              className="flex-1"
              disabled={topup.isPending}
              onClick={() => topup.mutate()}
            >
              {topup.isPending ? t("topUpSending") : t("topUpConfirm")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
