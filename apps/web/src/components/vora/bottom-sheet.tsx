"use client";

import { useCallback, useEffect, useState } from "react";
import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

export type SheetSnap = "peek" | "half" | "full";

/** Percent of viewport height visible at each snap point — §7 "peek / half / full". */
const SNAP_VH: Record<SheetSnap, number> = { peek: 18, half: 52, full: 92 };

/** §7 Motion: spring slide, stiffness ~300, damping ~30. */
const SHEET_SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

/** Height of the drag handle strip, excluded from the scrollable content area. */
const HANDLE_H = 26;

interface BottomSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  snaps?: SheetSnap[];
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  snap,
  onSnapChange,
  snaps = ["peek", "half", "full"],
  children,
  className,
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const [viewportH, setViewportH] = useState(0);

  useEffect(() => {
    const update = () => setViewportH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const panelHeight = (SNAP_VH.full / 100) * viewportH;
  const offsetFor = useCallback(
    (s: SheetSnap) => panelHeight - (SNAP_VH[s] / 100) * viewportH,
    [panelHeight, viewportH],
  );

  useEffect(() => {
    if (!viewportH) return;
    const controls = animate(y, offsetFor(snap), SHEET_SPRING);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, viewportH]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const projected = y.get() + info.velocity.y * 0.15;
    let nearest = snaps[0];
    let nearestDist = Infinity;
    for (const s of snaps) {
      const dist = Math.abs(offsetFor(s) - projected);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    onSnapChange(nearest);
  };

  const topOffset = offsetFor(snaps[snaps.length - 1]);
  const bottomOffset = offsetFor(snaps[0]);

  return (
    <motion.div
      drag="y"
      dragElastic={0.06}
      dragMomentum={false}
      dragConstraints={{ top: topOffset, bottom: bottomOffset }}
      onDragEnd={handleDragEnd}
      style={{ y, height: panelHeight || undefined }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-sheet bg-card shadow-vora-sheet touch-none",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Drag handle"
        className="flex shrink-0 cursor-grab justify-center pt-3 pb-2 active:cursor-grabbing"
        onClick={() => {
          const idx = snaps.indexOf(snap);
          const next = snaps[(idx + 1) % snaps.length];
          onSnapChange(next);
        }}
      >
        <span className="h-1.5 w-10 rounded-full bg-border" />
      </button>
      <div
        // The panel is always full-height and slid down, so at peek/half its
        // lower part sits below the viewport. Capping the scroll area to the
        // visible slice keeps content — the primary CTA above all — reachable
        // by scrolling instead of stranding it off-screen.
        style={{
          maxHeight: viewportH
            ? (SNAP_VH[snap] / 100) * viewportH - HANDLE_H
            : undefined,
        }}
        className="flex-1 touch-pan-y overflow-y-auto px-5 pb-6"
      >
        {children}
      </div>
    </motion.div>
  );
}
