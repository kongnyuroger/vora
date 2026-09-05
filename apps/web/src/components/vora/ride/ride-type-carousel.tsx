"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bike, Car, ChevronDown, Sparkles, Users } from "lucide-react";
import { RideType, type FareQuote } from "@vora/shared";
import { cn, formatDurationMin, formatXaf } from "@/lib/utils";

interface RideTypeCarouselProps {
  quotes: FareQuote[];
  selected: RideType;
  onSelect: (rideType: RideType) => void;
}

const RIDE_TYPE_ICON: Record<RideType, typeof Bike> = {
  [RideType.MOTO]: Bike,
  [RideType.TAXI]: Car,
  [RideType.SHARED]: Users,
  [RideType.COMFORT]: Sparkles,
};

export function RideTypeCarousel({
  quotes,
  selected,
  onSelect,
}: RideTypeCarouselProps) {
  const t = useTranslations("RideTypes");
  const tFare = useTranslations("Fare");
  const [expanded, setExpanded] = useState<RideType | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption font-medium text-muted-foreground">
        {t("heading")}
      </span>

      {quotes.map((quote) => {
        const Icon = RIDE_TYPE_ICON[quote.rideType];
        const isSelected = quote.rideType === selected;
        const isExpanded = quote.rideType === expanded;

        return (
          <div
            key={quote.rideType}
            className={cn(
              "rounded-card border transition-colors",
              isSelected
                ? "border-vora-green bg-vora-green-100"
                : "border-border bg-secondary",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(quote.rideType)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  isSelected ? "bg-vora-green text-white" : "bg-white text-vora-green",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-secondary-foreground">
                  {t(quote.rideType.toLowerCase())}
                </span>
                <span className="block truncate text-caption text-secondary-foreground/70">
                  {t(`${quote.rideType.toLowerCase()}Desc`)} ·{" "}
                  {formatDurationMin(quote.durationS)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="text-body font-semibold text-secondary-foreground">
                  {formatXaf(quote.breakdown.totalXaf)}
                </span>
                <ChevronDown
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(isExpanded ? null : quote.rideType);
                  }}
                  className={cn(
                    "size-4 text-secondary-foreground/60 transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </span>
            </button>

            {isExpanded && (
              <div className="flex flex-col gap-1 border-t border-border/60 px-4 py-3 text-caption text-secondary-foreground/80">
                <div className="flex justify-between">
                  <span>{tFare("base")}</span>
                  <span>{formatXaf(quote.breakdown.baseXaf)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{tFare("perKm")}</span>
                  <span>{formatXaf(quote.breakdown.distanceXaf)}</span>
                </div>
                {quote.breakdown.durationXaf > 0 && (
                  <div className="flex justify-between">
                    <span>{tFare("perMin")}</span>
                    <span>{formatXaf(quote.breakdown.durationXaf)}</span>
                  </div>
                )}
                {quote.breakdown.surge > 1 && (
                  <div className="flex justify-between text-vora-amber">
                    <span>{tFare("surge")}</span>
                    <span>×{quote.breakdown.surge.toFixed(1)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-border/60 pt-1.5 font-semibold text-secondary-foreground">
                  <span>{tFare("total")}</span>
                  <span>{formatXaf(quote.breakdown.totalXaf)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
