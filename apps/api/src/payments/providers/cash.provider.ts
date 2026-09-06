import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@vora/shared';
import type {
  CollectRequest,
  CollectResult,
  PaymentProvider,
} from './payment-provider.interface';

/**
 * Cash settles in the rider's hand at drop-off, so there is nothing to await:
 * the record exists to close the ride's books, not to move money.
 */
@Injectable()
export class CashProvider implements PaymentProvider {
  readonly name = 'cash';

  supports(method: PaymentMethod): boolean {
    return method === PaymentMethod.CASH;
  }

  collect(request: CollectRequest): Promise<CollectResult> {
    return Promise.resolve({
      reference: `cash:${request.externalRef}`,
      status: PaymentStatus.SUCCESS,
    });
  }

  getStatus(): Promise<PaymentStatus> {
    return Promise.resolve(PaymentStatus.SUCCESS);
  }
}
