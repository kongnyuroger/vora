import { RideType } from "./enums";

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

/** `max(minimum, base + perKm*km + perMin*min) * surge`, rounded to nearest 50 XAF. */
export function computeFareXaf(
  rideType: RideType,
  distanceM: number,
  durationS: number,
  surge: number = DEFAULT_SURGE,
): number {
  const entry = PRICE_BOOK[rideType];
  const km = distanceM / 1000;
  const min = durationS / 60;
  const raw = Math.max(
    entry.minimumXaf,
    entry.baseXaf + entry.perKmXaf * km + entry.perMinXaf * min,
  );
  return Math.round((raw * surge) / 50) * 50;
}
