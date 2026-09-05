import { Injectable } from '@nestjs/common';
import {
  computeFareBreakdown,
  currentSurge,
  RideType,
  type FareQuote,
  type FareQuoteResponse,
} from '@vora/shared';
import { RoutingService, type RoutePoint } from '../routing/routing.service';

const RIDE_TYPE_ORDER = [
  RideType.MOTO,
  RideType.TAXI,
  RideType.SHARED,
  RideType.COMFORT,
];

@Injectable()
export class FaresService {
  constructor(private readonly routing: RoutingService) {}

  async quote(
    pickup: RoutePoint,
    dropoff: RoutePoint,
  ): Promise<FareQuoteResponse> {
    const route = await this.routing.getRoute(pickup, dropoff);
    const surge = currentSurge();

    const quotes: FareQuote[] = RIDE_TYPE_ORDER.map((rideType) => ({
      rideType,
      distanceM: route.distanceM,
      durationS: route.durationS,
      breakdown: computeFareBreakdown(
        rideType,
        route.distanceM,
        route.durationS,
        surge,
      ),
    }));

    return {
      distanceM: route.distanceM,
      durationS: route.durationS,
      route: route.geometry,
      quotes,
    };
  }
}
