import { cn } from "@/lib/utils";

/** §7 Motion: "Skeleton loaders, never spinners-only." */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-card bg-muted", className)}
      {...props}
    />
  );
}
