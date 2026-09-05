import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RouteGeometry } from '@vora/shared';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface Route {
  distanceM: number;
  durationS: number;
  geometry: RouteGeometry;
}

interface MapboxDirectionsResponse {
  routes: {
    distance: number;
    duration: number;
    geometry: RouteGeometry;
  }[];
}

/** Average moto/taxi speed in mixed Yaoundé/Douala traffic, for the offline fallback. */
const FALLBACK_SPEED_KMH = 22;
const EARTH_RADIUS_M = 6371000;

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(private readonly config: ConfigService) {}

  async getRoute(pickup: RoutePoint, dropoff: RoutePoint): Promise<Route> {
    const token = this.config.get<string>('MAPBOX_SECRET');
    if (token) {
      const route = await this.getMapboxRoute(pickup, dropoff, token);
      if (route) return route;
    } else {
      this.logger.warn('MAPBOX_SECRET not set — using straight-line fallback');
    }

    return this.getFallbackRoute(pickup, dropoff);
  }

  private async getMapboxRoute(
    pickup: RoutePoint,
    dropoff: RoutePoint,
    token: string,
  ): Promise<Route | null> {
    const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`,
    );
    url.searchParams.set('access_token', token);
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('overview', 'full');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        this.logger.warn(`Mapbox Directions returned ${res.status}`);
        return null;
      }

      const data = (await res.json()) as MapboxDirectionsResponse;
      const route = data.routes?.[0];
      if (!route) return null;

      return {
        distanceM: Math.round(route.distance),
        durationS: Math.round(route.duration),
        geometry: route.geometry,
      };
    } catch (err) {
      this.logger.error('Mapbox Directions request failed', err);
      return null;
    }
  }

  private getFallbackRoute(pickup: RoutePoint, dropoff: RoutePoint): Route {
    const distanceM = Math.round(this.haversineM(pickup, dropoff));
    const durationS = Math.round(
      (distanceM / 1000 / FALLBACK_SPEED_KMH) * 3600,
    );

    return {
      distanceM,
      durationS,
      geometry: {
        type: 'LineString',
        coordinates: [
          [pickup.lng, pickup.lat],
          [dropoff.lng, dropoff.lat],
        ],
      },
    };
  }

  private haversineM(a: RoutePoint, b: RoutePoint): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
  }
}
