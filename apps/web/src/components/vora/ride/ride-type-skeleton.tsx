import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors RideTypeCarousel's row shape so the sheet doesn't jump when prices land. */
export function RideTypeSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3.5 w-28 rounded-full" />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-card border border-border bg-secondary px-4 py-3.5"
        >
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-3 w-36 rounded-full" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}
