import {
  PaymentMethod,
  RideStatus,
  RideType,
  SafetyEventType,
  VerificationStatus,
} from "./enums";
import type { Ride, RideTimelineEntry } from "./types";

export interface CreateRideRequest {
  rideType: RideType;
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffLabel: string;
  paymentMethod?: PaymentMethod;
}

export interface RideDriverInfo {
  userId: string;
  name: string | null;
  plateNumber: string;
  vehicleModel: string;
  color: string;
  verification: VerificationStatus;
  helmetProvided: boolean;
  ratingAvg: number;
  ratingCount: number;
}

export interface RideDetail extends Ride {
  driver: RideDriverInfo | null;
}

export interface CreateRideResponse {
  ride: RideDetail;
  driversNotified: number;
}

/** Statuses in which a ride is still waiting to be picked up. */
export const PRE_TRIP_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.SEARCHING,
  RideStatus.ACCEPTED,
  RideStatus.ARRIVING,
];

/** Terminal statuses — the ride is done and no further transitions apply. */
export const TERMINAL_RIDE_STATUSES: RideStatus[] = [
  RideStatus.COMPLETED,
  RideStatus.CANCELLED,
];

export interface RideStatusPayload {
  rideId: string;
  status: RideStatus;
  timeline: RideTimelineEntry[];
}

export interface DriverLocationPayload {
  rideId: string;
  lat: number;
  lng: number;
}

export interface RideTakenPayload {
  rideId: string;
}

export interface SosRequest {
  rideId: string;
  lat: number;
  lng: number;
}

export interface SafetyAlertPayload {
  rideId: string;
  type: SafetyEventType;
  at: string;
}

/** Read-only view for the public "share trip" link — no PIN, no rider identity. */
export interface PublicRideView {
  id: string;
  rideType: RideType;
  status: RideStatus;
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffLabel: string;
  driver: RideDriverInfo | null;
  driverLat: number | null;
  driverLng: number | null;
}
