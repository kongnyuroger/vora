import type {
  Payment as PrismaPayment,
  WalletTransaction as PrismaWalletTransaction,
} from '@prisma/client';
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  WalletTransactionType,
  WalletTransactionView,
} from '@vora/shared';

export function toPaymentView(payment: PrismaPayment): Payment {
  return {
    id: payment.id,
    rideId: payment.rideId,
    method: payment.method as unknown as PaymentMethod,
    status: payment.status as unknown as PaymentStatus,
    providerRef: payment.providerRef,
    amountXaf: payment.amountXaf,
    failureReason: payment.failureReason,
    createdAt: payment.createdAt.toISOString(),
  };
}

export function toWalletTransactionView(
  tx: PrismaWalletTransaction,
): WalletTransactionView {
  return {
    id: tx.id,
    type: tx.type as unknown as WalletTransactionType,
    status: tx.status as unknown as PaymentStatus,
    amountXaf: tx.amountXaf,
    ref: tx.ref,
    createdAt: tx.createdAt.toISOString(),
  };
}
