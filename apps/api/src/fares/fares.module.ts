import { Module } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module';
import { FaresController } from './fares.controller';
import { FaresService } from './fares.service';

@Module({
  imports: [RoutingModule],
  controllers: [FaresController],
  providers: [FaresService],
  exports: [FaresService],
})
export class FaresModule {}
