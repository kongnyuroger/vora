"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface SearchingSheetProps {
  pickupLabel: string;
  onCancel: () => void;
}

/** §7 "Searching-for-driver: pulsing radar animation around pickup." */
export function SearchingSheet({ pickupLabel, onCancel }: SearchingSheetProps) {
  const t = useTranslations("Ride");

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

      <Button variant="outline" onClick={onCancel}>
        {t("cancel")}
      </Button>
    </div>
  );
}
