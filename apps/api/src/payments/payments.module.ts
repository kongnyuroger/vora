import { Module } from '@nestjs/common';
import { CampayProvider } from './providers/campay.provider';
import { CashProvider } from './providers/cash.provider';
import { PAYMENT_PROVIDERS } from './providers/payment-provider.interface';
import { SimulatedMomoProvider } from './providers/simulated-momo.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    CashProvider,
    CampayProvider,
    SimulatedMomoProvider,
    {
      // Order is the resolution order: the first provider that supports a method
      // wins. Campay declares no support without credentials, which is what lets
      // the simulated rail take over on a laptop with no sandbox keys.
      provide: PAYMENT_PROVIDERS,
      inject: [CashProvider, CampayProvider, SimulatedMomoProvider],
      useFactory: (
        cash: CashProvider,
        campay: CampayProvider,
        simulated: SimulatedMomoProvider,
      ) => [cash, campay, simulated],
    },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
