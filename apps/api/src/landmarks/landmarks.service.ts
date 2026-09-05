import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Landmark as PrismaLandmark } from '@prisma/client';
import { City, type LandmarkSearchResult } from '@vora/shared';
import { PrismaService } from '../prisma/prisma.service';

const YAOUNDE_CENTER: [number, number] = [11.5021, 3.848];
const MAX_RESULTS = 8;

interface MapboxFeature {
  place_name: string;
  center: [number, number];
  context?: { id: string; text: string }[];
}

@Injectable()
export class LandmarksService {
  private readonly logger = new Logger(LandmarksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async search(
    query: string,
    proximity?: { lat: number; lng: number },
  ): Promise<LandmarkSearchResult[]> {
    const local = await this.searchLocal(query);
    if (local.length > 0) return local;

    return this.searchMapbox(query, proximity);
  }

  private async searchLocal(query: string): Promise<LandmarkSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const landmarks = await this.prisma.landmark.findMany();

    const scored = landmarks
      .map((l) => ({ landmark: l, score: this.matchScore(l, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    return scored.map(({ landmark }) => this.toResult(landmark));
  }

  private matchScore(landmark: PrismaLandmark, q: string): number {
    const name = landmark.name.toLowerCase();
    const quartier = landmark.quartier.toLowerCase();
    const aliases = landmark.aliases.map((a) => a.toLowerCase());

    if (name === q) return 100;
    if (name.startsWith(q)) return 80;
    if (aliases.some((a) => a === q || a.startsWith(q))) return 70;
    if (name.includes(q)) return 50;
    if (aliases.some((a) => a.includes(q))) return 40;
    if (quartier.includes(q)) return 20;
    return 0;
  }

  private toResult(landmark: PrismaLandmark): LandmarkSearchResult {
    return {
      id: landmark.id,
      name: landmark.name,
      quartier: landmark.quartier,
      city: landmark.city as unknown as City,
      lat: landmark.lat,
      lng: landmark.lng,
      category:
        landmark.category as unknown as LandmarkSearchResult['category'],
      source: 'landmark',
    };
  }

  private async searchMapbox(
    query: string,
    proximity?: { lat: number; lng: number },
  ): Promise<LandmarkSearchResult[]> {
    const token = this.config.get<string>('MAPBOX_SECRET');
    if (!token) {
      this.logger.warn('MAPBOX_SECRET not set — skipping geocoding fallback');
      return [];
    }

    const [lng, lat] = proximity
      ? [proximity.lng, proximity.lat]
      : YAOUNDE_CENTER;

    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set('access_token', token);
    url.searchParams.set('country', 'cm');
    url.searchParams.set('proximity', `${lng},${lat}`);
    url.searchParams.set('limit', '5');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) return [];

      const data = (await res.json()) as { features: MapboxFeature[] };
      return data.features.map((f, i) => ({
        id: `geocode:${f.center.join(',')}:${i}`,
        name: f.place_name,
        quartier: null,
        city: this.inferCity(f.place_name),
        lat: f.center[1],
        lng: f.center[0],
        category: null,
        source: 'geocode' as const,
      }));
    } catch (err) {
      this.logger.error('Mapbox geocoding fallback failed', err);
      return [];
    }
  }

  private inferCity(placeName: string): City | null {
    const lower = placeName.toLowerCase();
    if (lower.includes('yaound')) return City.YAOUNDE;
    if (lower.includes('douala')) return City.DOUALA;
    return null;
  }
}
