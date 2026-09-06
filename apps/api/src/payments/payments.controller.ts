import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { Payment, WalletTopupResponse, WalletView } from '@vora/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';
import { WalletTopupDto } from './dto/wallet-topup.dto';
import { PaymentsService } from './payments.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('payments/ride/:rideId')
  getRidePayment(
    @CurrentUser() user: RequestUser,
    @Param('rideId') rideId: string,
  ): Promise<Payment> {
    return this.payments.getRidePayment(rideId, user.userId);
  }

  /** POST rather than GET — it asks the provider for a fresh status, it isn't a cache read. */
  @Post('payments/ride/:rideId/refresh')
  refreshRidePayment(
    @CurrentUser() user: RequestUser,
    @Param('rideId') rideId: string,
  ): Promise<Payment> {
    return this.payments.refreshRidePayment(rideId, user.userId);
  }

  @Get('wallet')
  getWallet(@CurrentUser() user: RequestUser): Promise<WalletView> {
    return this.payments.getWallet(user.userId);
  }

  @Post('wallet/topup')
  topUp(
    @CurrentUser() user: RequestUser,
    @Body() dto: WalletTopupDto,
  ): Promise<WalletTopupResponse> {
    return this.payments.topUp(user.userId, dto);
  }
}
