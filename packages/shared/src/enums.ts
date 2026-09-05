export enum Role {
  RIDER = "RIDER",
  DRIVER = "DRIVER",
  ADMIN = "ADMIN",
}

export enum RideType {
  MOTO = "MOTO",
  TAXI = "TAXI",
  SHARED = "SHARED",
  COMFORT = "COMFORT",
}

export enum RideStatus {
  REQUESTED = "REQUESTED",
  SEARCHING = "SEARCHING",
  ACCEPTED = "ACCEPTED",
  ARRIVING = "ARRIVING",
  ARRIVED = "ARRIVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  CASH = "CASH",
  MOMO_MTN = "MOMO_MTN",
  MOMO_ORANGE = "MOMO_ORANGE",
  WALLET = "WALLET",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum VerificationStatus {
  UNVERIFIED = "UNVERIFIED",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
}

export enum City {
  YAOUNDE = "YAOUNDE",
  DOUALA = "DOUALA",
}

export enum LandmarkCategory {
  CARREFOUR = "CARREFOUR",
  MARKET = "MARKET",
  LANDMARK = "LANDMARK",
  QUARTIER = "QUARTIER",
  STOP = "STOP",
}

export enum SafetyEventType {
  SOS = "SOS",
  ROUTE_DEVIATION = "ROUTE_DEVIATION",
  SHARE_STARTED = "SHARE_STARTED",
}

export enum WalletTransactionType {
  TOPUP = "TOPUP",
  RIDE = "RIDE",
  REFUND = "REFUND",
}

export enum Language {
  EN = "en",
  FR = "fr",
  PCM = "pcm",
}
