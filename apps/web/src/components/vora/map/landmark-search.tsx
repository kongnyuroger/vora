"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { MapPin, Search, ShoppingBag, Signpost, X } from "lucide-react";
import type { LandmarkSearchResult } from "@vora/shared";
import { searchLandmarks } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

interface LandmarkSearchProps {
  proximity?: { lat: number; lng: number };
  onSelect: (result: LandmarkSearchResult) => void;
  onFocus?: () => void;
}

function ResultIcon({ result }: { result: LandmarkSearchResult }) {
  if (result.category === "MARKET") {
    return <ShoppingBag className="size-4 text-vora-green" />;
  }
  if (result.category === "CARREFOUR") {
    return <Signpost className="size-4 text-vora-green" />;
  }
  return <MapPin className="size-4 text-vora-green" />;
}

export function LandmarkSearch({
  proximity,
  onSelect,
  onFocus,
}: LandmarkSearchProps) {
  const t = useTranslations("Map");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: results, isFetching } = useQuery({
    queryKey: ["landmarks", debouncedQuery, proximity],
    queryFn: () => searchLandmarks(debouncedQuery, proximity),
    enabled: debouncedQuery.trim().length >= 2,
  });

  return (
    <div>
      <div className="flex items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5 shadow-vora-soft">
        <Search className="size-5 shrink-0 text-vora-green" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-transparent text-body font-medium text-secondary-foreground outline-none placeholder:text-secondary-foreground/60"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t("clear")}
            className="shrink-0 text-secondary-foreground/60"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {debouncedQuery.trim().length >= 2 && (
        <div className="mt-2 flex flex-col gap-1">
          {isFetching && (
            <div className="px-2 py-3 text-caption text-muted-foreground">
              {t("searching")}
            </div>
          )}

          {!isFetching && results?.length === 0 && (
            <div className="px-2 py-3 text-caption text-muted-foreground">
              {t("noResults")}
            </div>
          )}

          {!isFetching &&
            results?.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  onSelect(result);
                  setQuery("");
                }}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-card px-3 py-2.5 text-left transition-colors hover:bg-muted active:scale-[0.99]",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-vora-green-100">
                  <ResultIcon result={result} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-foreground">
                    {result.name}
                  </span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {[result.quartier, result.city]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
