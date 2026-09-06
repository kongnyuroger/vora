import type {
  AuthSession,
  CreateRideRequest,
  CreateRideResponse,
  FareQuoteResponse,
  LandmarkSearchResult,
  PublicRideView,
  RequestOtpPayload,
  RequestOtpResponse,
  RideDetail,
  User,
  VerifyOtpPayload,
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

export function getRide(rideId: string, token: string) {
  return apiFetch<RideDetail>(`/rides/${rideId}`, { token });
}

export function getPublicRide(rideId: string) {
  return apiFetch<PublicRideView>(`/rides/${rideId}/public`);
}
