import {
  City,
  LandmarkCategory,
  Language,
  PaymentMethod,
  PaymentStatus,
  Role,
  RideStatus,
  RideType,
  SafetyEventType,
  VerificationStatus,
  WalletTransactionType,
} from "./enums";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  language: Language;
  avatarUrl: string | null;
  walletBalanceXaf: number;
  createdAt: string;
}

export interface DriverProfile {
  userId: string;
  rideTypes: RideType[];
  plateNumber: string;
  vehicleModel: string;
  color: string;
  verification: VerificationStatus;
  helmetProvided: boolean;
  ratingAvg: number;
  ratingCount: number;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  updatedAt: string;
}

export interface RideTimelineEntry {
  status: RideStatus;
  at: string;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId: string | null;
  rideType: RideType;
  status: RideStatus;
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffLabel: string;
  distanceM: number;
  durationS: number;
  fareXaf: number;
  surgeMultiplier: number;
  paymentMethod: PaymentMethod;
  startPin: string;
  sharedGroupId: string | null;
  createdAt: string;
  timeline: RideTimelineEntry[];
}

export interface FareBreakdown {
  baseXaf: number;
  perKmXaf: number;
  perMinXaf: number;
  distanceXaf: number;
  durationXaf: number;
  surge: number;
  totalXaf: number;
}

export interface FareQuote {
  rideType: RideType;
  distanceM: number;
  durationS: number;
  breakdown: FareBreakdown;
}

export interface RouteGeometry {
  type: "LineString";
  /** [lng, lat] pairs, in Mapbox/GeoJSON order. */
  coordinates: [number, number][];
}

export interface FareQuoteResponse {
  distanceM: number;
  durationS: number;
  route: RouteGeometry;
  quotes: FareQuote[];
}

export interface Payment {
  id: string;
  rideId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  providerRef: string | null;
  amountXaf: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amountXaf: number;
  ref: string | null;
}

export interface SavedPlace {
  id: string;
  userId: string;
  label: string;
  lat: number;
  lng: number;
  landmarkText: string | null;
}

export interface Landmark {
  id: string;
  name: string;
  aliases: string[];
  quartier: string;
  city: City;
  lat: number;
  lng: number;
  category: LandmarkCategory;
}

export interface SafetyEvent {
  id: string;
  rideId: string;
  type: SafetyEventType;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface Rating {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  stars: number;
  comment: string | null;
}
