import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, isMomoMethod } from '@vora/shared';
import type {
  CollectRequest,
  CollectResult,
  PaymentProvider,
} from './payment-provider.interface';

/**
 * Stands in for Campay when no sandbox credentials are configured — the same
 * "degrade, don't break" shape RoutingService uses when MAPBOX_SECRET is unset,
 * so a MoMo charge is still demoable on a laptop with no keys.
 *
 * It mimics the real rail's timing: the charge starts PENDING, as if the
 * subscriber's handset were showing the approval prompt, and settles a few
 * seconds later on the next poll.
 */
const APPROVAL_DELAY_MS = 6000;
/** Campay's sandbox convention: a MSISDN ending in 0 approves, anything else declines. */
const DECLINE_SUFFIX = /[^0]$/;

@Injectable()
export class SimulatedMomoProvider implements PaymentProvider {
  readonly name = 'simulated-momo';

  private readonly logger = new Logger(SimulatedMomoProvider.name);
  private readonly charges = new Map<
    string,
    { settlesAt: number; outcome: PaymentStatus }
  >();

  supports(method: PaymentMethod): boolean {
    return isMomoMethod(method);
  }

  collect(request: CollectRequest): Promise<CollectResult> {
    const reference = `sim:${request.externalRef}`;
    this.charges.set(reference, {
      settlesAt: Date.now() + APPROVAL_DELAY_MS,
      outcome: DECLINE_SUFFIX.test(request.phone)
        ? PaymentStatus.FAILED
        : PaymentStatus.SUCCESS,
    });

    this.logger.warn(
      `CAMPAY_API_KEY/SECRET not set — simulating a MoMo charge of ${request.amountXaf} XAF to ${request.phone}`,
    );

    return Promise.resolve({ reference, status: PaymentStatus.PENDING });
  }

  getStatus(reference: string): Promise<PaymentStatus> {
    const charge = this.charges.get(reference);
    if (!charge) return Promise.resolve(PaymentStatus.FAILED);
    if (Date.now() < charge.settlesAt) {
      return Promise.resolve(PaymentStatus.PENDING);
    }

    this.charges.delete(reference);
    return Promise.resolve(charge.outcome);
  }
}
