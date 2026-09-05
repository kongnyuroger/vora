"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet, type SheetSnap } from "@/components/vora/bottom-sheet";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

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
  const [snap, setSnap] = useState<SheetSnap>("peek");

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-vora-ink">
      {/* Map-hero placeholder — real Mapbox map lands in Branch 2 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--vora-green-700),var(--vora-ink)_70%)]" />

      <div className="relative z-10 flex items-center justify-between px-5 pt-6">
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

      <div className="relative z-10 mt-10 px-6">
        <p className="max-w-xs text-body text-white/85">{copy.tagline}</p>
      </div>

      <BottomSheet snap={snap} onSnapChange={setSnap}>
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setSnap("full")}
            className="flex w-full items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5 text-left text-body font-medium text-secondary-foreground shadow-vora-soft transition-transform active:scale-[0.98]"
          >
            <Search className="size-5 shrink-0 text-vora-green" />
            {copy.cta}
          </button>

          <div className="flex items-center gap-2 text-caption text-muted-foreground">
            <MapPin className="size-4 text-vora-amber" />
            {copy.scaffoldNotice}
          </div>

          <Button size="cta" className="w-full">
            {copy.cta}
          </Button>
        </div>
      </BottomSheet>
    </main>
  );
}
