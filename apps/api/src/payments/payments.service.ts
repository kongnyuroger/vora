import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod as DbPaymentMethod,
  PaymentStatus as DbPaymentStatus,
  WalletTransactionType as DbWalletTransactionType,
} from '@prisma/client';
import {
  MAX_TOPUP_XAF,
  MIN_TOPUP_XAF,
  PaymentMethod,
  PaymentStatus,
  type Payment,
  type WalletTopupRequest,
  type WalletTopupResponse,
  type WalletView,
} from '@vora/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toPaymentView, toWalletTransactionView } from './payments.mapper';
import {
  PAYMENT_PROVIDERS,
  type PaymentProvider,
} from './providers/payment-provider.interface';

const WALLET_HISTORY_LIMIT = 20;
const MOMO_DECLINED_REASON = 'The Mobile Money charge was not approved';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDERS)
    private readonly providers: PaymentProvider[],
  ) {}

  /**
   * Books the fare for a completed ride. Idempotent: replaying it (a reconnecting
   * driver client, a retried complete) returns the payment already on file rather
   * than charging twice.
   */
  async settleRide(rideId: string): Promise<Payment> {
    const existing = await this.prisma.payment.findUnique({
      where: { rideId },
    });
    if (existing) return toPaymentView(existing);

    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { rider: true },
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const method = ride.paymentMethod as unknown as PaymentMethod;
    if (method === PaymentMethod.WALLET) {
      return this.settleFromWallet(rideId, ride.riderId, ride.fareXaf);
    }

    const provider = this.providerFor(method);
    const result = await provider.collect({
      amountXaf: ride.fareXaf,
      phone: toMsisdn(ride.rider.phone),
      description: `VORA ride ${rideId}`,
      externalRef: rideId,
    });

    const payment = await this.prisma.payment.create({
      data: {
        rideId,
        method: method,
        status: result.status,
        providerRef: result.reference,
        amountXaf: ride.fareXaf,
        failureReason: result.failureReason ?? null,
      },
    });

    this.logger.log(
      `Ride ${rideId} settled via ${provider.name}: ${payment.status} (${ride.fareXaf} XAF)`,
    );
    return toPaymentView(payment);
  }

  async getRidePayment(rideId: string, userId: string): Promise<Payment> {
    await this.assertRideParticipant(rideId, userId);

    const payment = await this.prisma.payment.findUnique({ where: { rideId } });
    if (!payment) throw new NotFoundException('No payment for this ride yet');
    return toPaymentView(payment);
  }

  /** Re-polls the provider for a PENDING MoMo charge — the rider's "check status" tap. */
  async refreshRidePayment(rideId: string, userId: string): Promise<Payment> {
    await this.assertRideParticipant(rideId, userId);

    const payment = await this.prisma.payment.findUnique({ where: { rideId } });
    if (!payment) throw new NotFoundException('No payment for this ride yet');
    if (payment.status !== DbPaymentStatus.PENDING || !payment.providerRef) {
      return toPaymentView(payment);
    }

    const method = payment.method as unknown as PaymentMethod;
    const status = await this.providerFor(method).getStatus(
      payment.providerRef,
    );
    if (status === PaymentStatus.PENDING) return toPaymentView(payment);

    // Rider and driver both poll the same charge, so the write is conditional on
    // the row still being PENDING — whoever loses the race must not be able to
    // stamp a stale answer over an already-settled payment.
    await this.prisma.payment.updateMany({
      where: { id: payment.id, status: DbPaymentStatus.PENDING },
      data: {
        status,
        failureReason:
          status === PaymentStatus.FAILED ? MOMO_DECLINED_REASON : null,
      },
    });

    const settled = await this.prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
    });
    return toPaymentView(settled);
  }

  /** Settles pending top-ups first, so the balance reflects anything just approved. */
  async getWallet(userId: string): Promise<WalletView> {
    await this.settlePendingTopups(userId);

    const [user, transactions] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { walletBalanceXaf: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: WALLET_HISTORY_LIMIT,
      }),
    ]);

    return {
      balanceXaf: user.walletBalanceXaf,
      transactions: transactions.map(toWalletTransactionView),
    };
  }

  async topUp(
    userId: string,
    dto: WalletTopupRequest,
  ): Promise<WalletTopupResponse> {
    if (dto.amountXaf < MIN_TOPUP_XAF || dto.amountXaf > MAX_TOPUP_XAF) {
      throw new BadRequestException(
        `Top-up must be between ${MIN_TOPUP_XAF} and ${MAX_TOPUP_XAF} XAF`,
      );
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Recorded before the charge leaves, so the provider reference has somewhere
    // to land even if the process dies mid-request — an orphaned PENDING row is
    // recoverable, money moved with no record of it is not.
    const pending = await this.prisma.walletTransaction.create({
      data: {
        userId,
        type: DbWalletTransactionType.TOPUP,
        status: DbPaymentStatus.PENDING,
        method: dto.method,
        amountXaf: dto.amountXaf,
      },
    });

    const result = await this.providerFor(dto.method).collect({
      amountXaf: dto.amountXaf,
      phone: toMsisdn(user.phone),
      description: 'VORA wallet top-up',
      externalRef: pending.id,
    });

    const transaction = await this.prisma.walletTransaction.update({
      where: { id: pending.id },
      data: {
        ref: result.reference,
        status: result.status,
      },
    });

    // A provider that settles synchronously still has to move the balance here —
    // settlePendingTopups only ever looks at rows left PENDING.
    const balanceXaf =
      result.status === PaymentStatus.SUCCESS
        ? await this.creditWallet(userId, pending.id, dto.amountXaf)
        : user.walletBalanceXaf;

    return { transaction: toWalletTransactionView(transaction), balanceXaf };
  }

  async assertRideParticipant(rideId: string, userId: string): Promise<void> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: { riderId: true, driverId: true },
    });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException('Not a participant in this ride');
    }
  }

  private async settleFromWallet(
    rideId: string,
    riderId: string,
    fareXaf: number,
  ): Promise<Payment> {
    // One transaction, so a debit and its ledger entry can never diverge. The
    // balance guard lives in the WHERE clause rather than a read-then-write, so
    // two concurrent debits can't both spend the same balance.
    const payment = await this.prisma.$transaction(async (tx) => {
      const debited = await tx.user.updateMany({
        where: { id: riderId, walletBalanceXaf: { gte: fareXaf } },
        data: { walletBalanceXaf: { decrement: fareXaf } },
      });

      if (debited.count === 0) {
        return tx.payment.create({
          data: {
            rideId,
            method: DbPaymentMethod.WALLET,
            status: DbPaymentStatus.FAILED,
            amountXaf: fareXaf,
            failureReason: 'Insufficient wallet balance',
          },
        });
      }

      await tx.walletTransaction.create({
        data: {
          userId: riderId,
          type: DbWalletTransactionType.RIDE,
          status: DbPaymentStatus.SUCCESS,
          amountXaf: -fareXaf,
          ref: rideId,
        },
      });

      return tx.payment.create({
        data: {
          rideId,
          method: DbPaymentMethod.WALLET,
          status: DbPaymentStatus.SUCCESS,
          providerRef: `wallet:${rideId}`,
          amountXaf: fareXaf,
        },
      });
    });

    return toPaymentView(payment);
  }

  private async settlePendingTopups(userId: string): Promise<void> {
    const pending = await this.prisma.walletTransaction.findMany({
      where: {
        userId,
        type: DbWalletTransactionType.TOPUP,
        status: DbPaymentStatus.PENDING,
        ref: { not: null },
      },
    });

    for (const tx of pending) {
      const method = (tx.method ?? DbPaymentMethod.MOMO_MTN) as PaymentMethod;
      const status = await this.providerFor(method).getStatus(tx.ref!);
      if (status === PaymentStatus.PENDING) continue;

      // Conditional update, so two concurrent wallet reads racing on the same
      // approved top-up can't both go on to credit the balance.
      const settled = await this.prisma.walletTransaction.updateMany({
        where: { id: tx.id, status: DbPaymentStatus.PENDING },
        data: { status: status },
      });
      if (settled.count === 0) continue;

      if (status === PaymentStatus.SUCCESS) {
        await this.creditWallet(userId, tx.id, tx.amountXaf);
      }
    }
  }

  private async creditWallet(
    userId: string,
    transactionId: string,
    amountXaf: number,
  ): Promise<number> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { walletBalanceXaf: { increment: amountXaf } },
    });
    this.logger.log(
      `Top-up ${transactionId} credited ${amountXaf} XAF to ${userId}`,
    );
    return user.walletBalanceXaf;
  }

  private providerFor(method: PaymentMethod): PaymentProvider {
    const provider = this.providers.find((p) => p.supports(method));
    if (!provider) {
      throw new BadRequestException(`No payment provider for ${method}`);
    }
    return provider;
  }
}

/** "+237670000000" -> "237670000000" — providers take a bare MSISDN. */
function toMsisdn(phone: string): string {
  return phone.replace(/\D/g, '');
}
