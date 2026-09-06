import { IsIn, IsInt, Max, Min } from 'class-validator';
import {
  MAX_TOPUP_XAF,
  MIN_TOPUP_XAF,
  MOMO_METHODS,
  PaymentMethod,
} from '@vora/shared';

export class WalletTopupDto {
  @IsInt()
  @Min(MIN_TOPUP_XAF)
  @Max(MAX_TOPUP_XAF)
  amountXaf: number;

  /** Only Mobile Money can fund a wallet — cash top-ups would need an agent network. */
  @IsIn(MOMO_METHODS)
  method: PaymentMethod.MOMO_MTN | PaymentMethod.MOMO_ORANGE;
}
