import { PaymentMethod, PaymentStatus } from "./enums";
import type { Payment, WalletTransaction } from "./types";

/** Mobile Money methods — the ones that leave for a provider and come back PENDING. */
export const MOMO_METHODS: PaymentMethod[] = [
  PaymentMethod.MOMO_MTN,
  PaymentMethod.MOMO_ORANGE,
];

export function isMomoMethod(method: PaymentMethod): boolean {
  return MOMO_METHODS.includes(method);
}

/** PENDING is the only status a payment can still move out of — clients poll while here. */
export function isPaymentSettled(status: PaymentStatus): boolean {
  return status !== PaymentStatus.PENDING;
}

export interface PaymentStatusPayload {
  rideId: string;
  payment: Payment;
}

/** A wallet transaction as returned to its own owner — userId is implied by the session. */
export type WalletTransactionView = Omit<WalletTransaction, "userId">;

export interface WalletView {
  balanceXaf: number;
  transactions: WalletTransactionView[];
}

export interface WalletTopupRequest {
  amountXaf: number;
  /** Only Mobile Money can fund a wallet — cash top-ups would need an agent network. */
  method: PaymentMethod.MOMO_MTN | PaymentMethod.MOMO_ORANGE;
}

export interface WalletTopupResponse {
  transaction: WalletTransactionView;
  balanceXaf: number;
}

/** Quick-pick top-up amounts, in denominations people actually load in Cameroon. */
export const TOPUP_PRESETS_XAF = [1000, 2000, 5000, 10000];

export const MIN_TOPUP_XAF = 500;
export const MAX_TOPUP_XAF = 100000;
