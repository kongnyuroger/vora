import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { FaresModule } from '../fares/fares.module';
import { RidesController } from './rides.controller';
import { RidesGateway } from './rides.gateway';
import { RidesService } from './rides.service';

@Module({
  imports: [
    FaresModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
      }),
    }),
  ],
  controllers: [RidesController],
  providers: [RidesService, RidesGateway],
})
export class RidesModule {}
