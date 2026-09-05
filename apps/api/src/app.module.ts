import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FaresModule } from './fares/fares.module';
import { HealthModule } from './health/health.module';
import { LandmarksModule } from './landmarks/landmarks.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoutingModule } from './routing/routing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    LandmarksModule,
    RoutingModule,
    FaresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
