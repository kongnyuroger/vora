import type {
  AuthSession,
  CreateRideRequest,
  CreateRideResponse,
  FareQuoteResponse,
  LandmarkSearchResult,
  NearbyDriver,
  Payment,
  PublicRideView,
  RequestOtpPayload,
  RequestOtpResponse,
  RideDetail,
  User,
  VerifyOtpPayload,
  WalletTopupRequest,
  WalletTopupResponse,
  WalletView,
} from "@vora/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const { token, headers, ...rest } = init ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.message ?? `Request failed with ${res.status}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export function requestOtp(payload: RequestOtpPayload) {
  return apiFetch<RequestOtpResponse>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return apiFetch<AuthSession>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(token: string) {
  return apiFetch<User>("/auth/me", { token });
}

export function searchLandmarks(
  q: string,
  proximity?: { lat: number; lng: number },
) {
  const params = new URLSearchParams({ q });
  if (proximity) {
    params.set("lat", String(proximity.lat));
    params.set("lng", String(proximity.lng));
  }
  return apiFetch<LandmarkSearchResult[]>(`/landmarks/search?${params}`);
}

export function getFareQuote(payload: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}) {
  return apiFetch<FareQuoteResponse>("/fares/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createRide(payload: CreateRideRequest, token: string) {
  return apiFetch<CreateRideResponse>("/rides", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getNearbyDrivers(
  point: { lat: number; lng: number },
  token: string,
) {
  const params = new URLSearchParams({
    lat: String(point.lat),
    lng: String(point.lng),
  });
  return apiFetch<NearbyDriver[]>(`/rides/nearby-drivers?${params}`, { token });
}

export function getRide(rideId: string, token: string) {
  return apiFetch<RideDetail>(`/rides/${rideId}`, { token });
}

export function getPublicRide(rideId: string) {
  return apiFetch<PublicRideView>(`/rides/${rideId}/public`);
}

export function getRidePayment(rideId: string, token: string) {
  return apiFetch<Payment>(`/payments/ride/${rideId}`, { token });
}

/** Asks the provider for a fresh status — use while a MoMo charge is still PENDING. */
export function refreshRidePayment(rideId: string, token: string) {
  return apiFetch<Payment>(`/payments/ride/${rideId}/refresh`, {
    method: "POST",
    token,
  });
}

export function getWallet(token: string) {
  return apiFetch<WalletView>("/wallet", { token });
}

export function topUpWallet(payload: WalletTopupRequest, token: string) {
  return apiFetch<WalletTopupResponse>("/wallet/topup", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
