import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RideStatus as DbRideStatus,
  RideType as DbRideType,
  VerificationStatus as DbVerificationStatus,
} from '@prisma/client';
import {
  RideStatus,
  type CreateRideRequest,
  type RideDetail,
  type RideTimelineEntry,
  type RideType,
} from '@vora/shared';
import { FaresService } from '../fares/fares.service';
import { PrismaService } from '../prisma/prisma.service';
import { toRideDetail } from './rides.mapper';

/** Only consider drivers within this radius when dispatching a request. */
const SEARCH_RADIUS_M = 15000;
const MAX_CANDIDATE_DRIVERS = 5;
const PLATE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const RIDE_INCLUDE = {
  driver: { include: { driverProfile: true } },
} satisfies Prisma.RideInclude;

interface DriverCandidate {
  userId: string;
  distanceM: number;
}

@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fares: FaresService,
  ) {}

  async createRide(
    riderId: string,
    dto: CreateRideRequest,
  ): Promise<{ ride: RideDetail; candidateDriverIds: string[] }> {
    const pickup = { lat: dto.pickupLat, lng: dto.pickupLng };
    const dropoff = { lat: dto.dropoffLat, lng: dto.dropoffLng };

    // Re-quote server-side rather than trusting a client-supplied fare —
    // the price shown to the rider must always trace back to our own
    // routing + price-book computation.
    const quote = await this.fares.quote(pickup, dropoff);
    const forType = quote.quotes.find((q) => q.rideType === dto.rideType);
    if (!forType) {
      throw new BadRequestException(
        `No fare available for ride type ${dto.rideType}`,
      );
    }

    const startPin = String(Math.floor(1000 + Math.random() * 9000));
    const timeline: RideTimelineEntry[] = [
      { status: RideStatus.REQUESTED, at: new Date().toISOString() },
      { status: RideStatus.SEARCHING, at: new Date().toISOString() },
    ];

    const created = await this.prisma.ride.create({
      data: {
        riderId,
        rideType: dto.rideType,
        status: DbRideStatus.SEARCHING,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupLabel: dto.pickupLabel,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        dropoffLabel: dto.dropoffLabel,
        distanceM: forType.distanceM,
        durationS: forType.durationS,
        fareXaf: forType.breakdown.totalXaf,
        surgeMultiplier: forType.breakdown.surge,
        paymentMethod: dto.paymentMethod,
        startPin,
        timeline: timeline as unknown as Prisma.InputJsonValue,
      },
      include: RIDE_INCLUDE,
    });

    const candidates = await this.findNearbyOnlineDrivers(dto.rideType, pickup);

    if (candidates.length === 0) {
      // Nobody to notify — cancel now instead of leaving a zombie
      // SEARCHING ride that will never be accepted.
      const cancelled = await this.transitionStatus(created.id, [
        RideStatus.CANCELLED,
      ]);
      return { ride: cancelled, candidateDriverIds: [] };
    }

    return {
      ride: toRideDetail(created),
      candidateDriverIds: candidates.map((c) => c.userId),
    };
  }

  async findNearbyOnlineDrivers(
    rideType: RideType,
    point: { lat: number; lng: number },
  ): Promise<DriverCandidate[]> {
    const rows = await this.prisma.$queryRaw<DriverCandidate[]>`
      SELECT "userId",
        ST_DistanceSphere(
          ST_MakePoint("currentLng", "currentLat"),
          ST_MakePoint(${point.lng}, ${point.lat})
        ) AS "distanceM"
      FROM driver_profiles
      WHERE "isOnline" = true
        AND "currentLat" IS NOT NULL
        AND "currentLng" IS NOT NULL
        AND ${rideType}::"RideType" = ANY("rideTypes")
      ORDER BY "distanceM" ASC
      LIMIT ${MAX_CANDIDATE_DRIVERS}
    `;

    return rows.filter((r) => Number(r.distanceM) <= SEARCH_RADIUS_M);
  }

  /**
   * Marks a driver online, auto-provisioning a demo DriverProfile on first
   * use — this hackathon build has no separate driver onboarding form, the
   * same shortcut the dev-mode OTP flow already takes for auth.
   */
  async setDriverOnline(userId: string, lat: number, lng: number) {
    await this.prisma.driverProfile.upsert({
      where: { userId },
      update: { isOnline: true, currentLat: lat, currentLng: lng },
      create: {
        userId,
        isOnline: true,
        currentLat: lat,
        currentLng: lng,
        rideTypes: [DbRideType.MOTO, DbRideType.TAXI],
        plateNumber: `CE ${Math.floor(100 + Math.random() * 900)} ${randomPlateLetters(2)}`,
        vehicleModel: 'Yamaha DT125',
        color: 'Rouge',
        verification: DbVerificationStatus.VERIFIED,
        helmetProvided: true,
      },
    });
  }

  async setDriverOffline(userId: string) {
    await this.prisma.driverProfile.updateMany({
      where: { userId },
      data: { isOnline: false },
    });
  }

  async updateDriverLocation(userId: string, lat: number, lng: number) {
    await this.prisma.driverProfile.updateMany({
      where: { userId },
      data: { currentLat: lat, currentLng: lng },
    });
  }

  /** Atomically assigns a driver to a still-SEARCHING ride; null if another driver won the race. */
  async tryClaimRide(
    rideId: string,
    driverId: string,
  ): Promise<RideDetail | null> {
    const claim = await this.prisma.ride.updateMany({
      where: { id: rideId, status: DbRideStatus.SEARCHING, driverId: null },
      data: { driverId, status: DbRideStatus.ARRIVING },
    });
    if (claim.count === 0) return null;

    return this.transitionStatus(rideId, [
      RideStatus.ACCEPTED,
      RideStatus.ARRIVING,
    ]);
  }

  /** Driver-tap-driven transition (arrived / start trip / complete trip), guarded by current status + ownership. */
  async advanceStatus(
    rideId: string,
    driverId: string,
    from: RideStatus,
    to: RideStatus,
  ): Promise<RideDetail> {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driverId !== driverId) {
      throw new ForbiddenException('Not the assigned driver for this ride');
    }
    if ((ride.status as unknown as RideStatus) !== from) {
      throw new BadRequestException(
        `Ride is ${ride.status}, expected ${from} before moving to ${to}`,
      );
    }

    return this.transitionStatus(rideId, [to]);
  }

  async cancelRide(rideId: string, requesterId: string): Promise<RideDetail> {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.riderId !== requesterId && ride.driverId !== requesterId) {
      throw new ForbiddenException('Not a participant in this ride');
    }

    const status = ride.status as unknown as RideStatus;
    if (status === RideStatus.COMPLETED || status === RideStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel a ${status} ride`);
    }

    return this.transitionStatus(rideId, [RideStatus.CANCELLED]);
  }

  async getRideForParticipant(
    rideId: string,
    userId: string,
  ): Promise<RideDetail> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: RIDE_INCLUDE,
    });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException('Not a participant in this ride');
    }

    return toRideDetail(ride);
  }

  private async transitionStatus(
    rideId: string,
    statuses: RideStatus[],
  ): Promise<RideDetail> {
    const current = await this.prisma.ride.findUniqueOrThrow({
      where: { id: rideId },
    });
    const existingTimeline = current.timeline as unknown as RideTimelineEntry[];
    const now = new Date().toISOString();
    const timeline: RideTimelineEntry[] = [
      ...existingTimeline,
      ...statuses.map((status) => ({ status, at: now })),
    ];
    const finalStatus = statuses[statuses.length - 1];

    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: finalStatus,
        timeline: timeline as unknown as Prisma.InputJsonValue,
      },
      include: RIDE_INCLUDE,
    });

    return toRideDetail(updated);
  }
}

function randomPlateLetters(count: number): string {
  return Array.from(
    { length: count },
    () => PLATE_LETTERS[Math.floor(Math.random() * PLATE_LETTERS.length)],
  ).join('');
}
