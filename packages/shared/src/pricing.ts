import { RideType } from "./enums";
import type { FareBreakdown } from "./types";

export interface PriceBookEntry {
  rideType: RideType;
  baseXaf: number;
  perKmXaf: number;
  perMinXaf: number;
  minimumXaf: number;
}

export const PRICE_BOOK: Record<RideType, PriceBookEntry> = {
  [RideType.MOTO]: {
    rideType: RideType.MOTO,
    baseXaf: 300,
    perKmXaf: 100,
    perMinXaf: 15,
    minimumXaf: 500,
  },
  [RideType.TAXI]: {
    rideType: RideType.TAXI,
    baseXaf: 600,
    perKmXaf: 250,
    perMinXaf: 25,
    minimumXaf: 1000,
  },
  [RideType.SHARED]: {
    rideType: RideType.SHARED,
    baseXaf: 300,
    perKmXaf: 120,
    perMinXaf: 0,
    minimumXaf: 500,
  },
  [RideType.COMFORT]: {
    rideType: RideType.COMFORT,
    baseXaf: 1000,
    perKmXaf: 350,
    perMinXaf: 40,
    minimumXaf: 2000,
  },
};

export const DEFAULT_SURGE = 1.0;
export const PEAK_SURGE = 1.3;

/** Peak hours in WAT (UTC+1, Cameroon has no DST) — morning and evening rush. */
const PEAK_WINDOWS_WAT: [number, number][] = [
  [7, 9],
  [17, 19],
];

/** 1.3x during peak hours, 1.0x otherwise — evaluated in Cameroon local time (WAT). */
export function currentSurge(now: Date = new Date()): number {
  const watHour = (now.getUTCHours() + 1) % 24;
  const isPeak = PEAK_WINDOWS_WAT.some(
    ([start, end]) => watHour >= start && watHour < end,
  );
  return isPeak ? PEAK_SURGE : DEFAULT_SURGE;
}

/** `max(minimum, base + perKm*km + perMin*min) * surge`, rounded to nearest 50 XAF. */
export function computeFareBreakdown(
  rideType: RideType,
  distanceM: number,
  durationS: number,
  surge: number = DEFAULT_SURGE,
): FareBreakdown {
  const entry = PRICE_BOOK[rideType];
  const km = distanceM / 1000;
  const min = durationS / 60;
  const distanceXaf = Math.round(entry.perKmXaf * km);
  const durationXaf = Math.round(entry.perMinXaf * min);
  const raw = Math.max(
    entry.minimumXaf,
    entry.baseXaf + distanceXaf + durationXaf,
  );
  const totalXaf = Math.round((raw * surge) / 50) * 50;

  return {
    baseXaf: entry.baseXaf,
    perKmXaf: entry.perKmXaf,
    perMinXaf: entry.perMinXaf,
    distanceXaf,
    durationXaf,
    surge,
    totalXaf,
  };
}

export function computeFareXaf(
  rideType: RideType,
  distanceM: number,
  durationS: number,
  surge: number = DEFAULT_SURGE,
): number {
  return computeFareBreakdown(rideType, distanceM, durationS, surge).totalXaf;
}
