import type { PaymentMethod, PaymentStatus } from '@vora/shared';

export interface CollectRequest {
  amountXaf: number;
  /** Subscriber MSISDN in international format without '+', e.g. 237670000000. */
  phone: string;
  description: string;
  /** Our own id for this charge (ride id / wallet transaction id) so we can reconcile. */
  externalRef: string;
}

export interface CollectResult {
  /** Provider-side reference — stored so the charge can be polled later. */
  reference: string;
  status: PaymentStatus;
  /** Set when the charge is already terminal on creation, e.g. a rejected request. */
  failureReason?: string;
}

/**
 * One interface, several money rails. Cash is deliberately a provider too —
 * it keeps ride settlement free of `if (method === CASH)` branches, and it
 * means the live demo never depends on a sandbox being reachable.
 */
export interface PaymentProvider {
  readonly name: string;
  supports(method: PaymentMethod): boolean;
  collect(request: CollectRequest): Promise<CollectResult>;
  getStatus(reference: string): Promise<PaymentStatus>;
}

export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');
