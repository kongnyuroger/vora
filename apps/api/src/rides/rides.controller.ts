import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { CreateRideResponse, NearbyDriver } from '@vora/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';
import { CreateRideDto } from './dto/create-ride.dto';
import { NearbyDriversDto } from './dto/nearby-drivers.dto';
import { RidesGateway } from './rides.gateway';
import { RidesService } from './rides.service';

/** Roughly the area a rider would consider "around me" in a Cameroonian city. */
const NEARBY_RADIUS_M = 6000;
const NEARBY_LIMIT = 12;

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
      this.gateway.reachableDriverIds(),
    );

    if (candidateDriverIds.length > 0) {
      this.gateway.broadcastRideRequest(ride, candidateDriverIds);
    }

    return { ride, driversNotified: candidateDriverIds.length };
  }

  /** Map pins for online drivers around a point — no identity, just presence. */
  @Get('nearby-drivers')
  @UseGuards(JwtAuthGuard)
  nearbyDrivers(@Query() query: NearbyDriversDto): Promise<NearbyDriver[]> {
    return this.ridesService.findNearbyDriverPins(
      { lat: query.lat, lng: query.lng },
      NEARBY_RADIUS_M,
      NEARBY_LIMIT,
    );
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
