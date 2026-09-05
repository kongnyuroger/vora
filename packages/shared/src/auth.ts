import { Role } from "./enums";
import type { User } from "./types";

export interface RequestOtpPayload {
  phone: string;
  role?: Role.RIDER | Role.DRIVER;
}

export interface RequestOtpResponse {
  phone: string;
  expiresInS: number;
  /** Only ever populated in dev mode — never in a real deployment. */
  devOtp?: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}
