"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface SearchingSheetProps {
  pickupLabel: string;
  onCancel: () => void;
}

/**
 * How long before we admit the search is dragging. No driver ever has to accept,
 * so without this the rider is left watching a spinner with nothing to go on —
 * the hint is copy only, it never cancels the ride on the rider's behalf.
 */
const SLOW_SEARCH_MS = 30000;

/** §7 "Searching-for-driver: pulsing radar animation around pickup." */
export function SearchingSheet({ pickupLabel, onCancel }: SearchingSheetProps) {
  const t = useTranslations("Ride");
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_SEARCH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="relative flex size-16 items-center justify-center">
        {[0, 0.5].map((delay) => (
          <motion.span
            key={delay}
            className="absolute inset-0 rounded-full bg-vora-green/30"
            animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
        <span className="relative flex size-12 items-center justify-center rounded-full bg-vora-green text-white">
          <Loader2 className="size-5 animate-spin" />
        </span>
      </div>

      <div>
        <p className="text-body font-semibold text-secondary-foreground">
          {t("searchingTitle")}
        </p>
        <p className="text-caption text-muted-foreground">
          {t("searchingNear", { pickup: pickupLabel })}
        </p>
      </div>

      {isSlow && (
        <p className="rounded-card bg-vora-amber-100 px-4 py-2.5 text-caption text-vora-green-700">
          {t("searchingSlow")}
        </p>
      )}

      <Button variant="outline" onClick={onCancel}>
        {t("cancel")}
      </Button>
    </div>
  );
}
