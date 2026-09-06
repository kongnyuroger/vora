import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { CreateRideResponse } from '@vora/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';
import { CreateRideDto } from './dto/create-ride.dto';
import { RidesGateway } from './rides.gateway';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly gateway: RidesGateway,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateRideDto,
  ): Promise<CreateRideResponse> {
    const { ride, candidateDriverIds } = await this.ridesService.createRide(
      user.userId,
      dto,
    );

    if (candidateDriverIds.length > 0) {
      this.gateway.broadcastRideRequest(ride, candidateDriverIds);
    }

    return { ride, driversNotified: candidateDriverIds.length };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ridesService.getRideForParticipant(id, user.userId);
  }

  /** Public "share trip" link — no auth, the unguessable ride id is the capability. */
  @Get(':id/public')
  getPublic(@Param('id') id: string) {
    return this.ridesService.getPublicRideView(id);
  }
}
