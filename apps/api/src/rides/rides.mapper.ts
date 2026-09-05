import type {
  DriverProfile as PrismaDriverProfile,
  Ride as PrismaRide,
  User as PrismaUser,
} from '@prisma/client';
import type {
  PaymentMethod,
  RideDetail,
  RideDriverInfo,
  RideStatus,
  RideTimelineEntry,
  RideType,
  VerificationStatus,
} from '@vora/shared';

type RideWithDriver = PrismaRide & {
  driver: (PrismaUser & { driverProfile: PrismaDriverProfile | null }) | null;
};

export function toRideDetail(ride: RideWithDriver): RideDetail {
  return {
    id: ride.id,
    riderId: ride.riderId,
    driverId: ride.driverId,
    rideType: ride.rideType as unknown as RideType,
    status: ride.status as unknown as RideStatus,
    pickupLat: ride.pickupLat,
    pickupLng: ride.pickupLng,
    pickupLabel: ride.pickupLabel,
    dropoffLat: ride.dropoffLat,
    dropoffLng: ride.dropoffLng,
    dropoffLabel: ride.dropoffLabel,
    distanceM: ride.distanceM,
    durationS: ride.durationS,
    fareXaf: ride.fareXaf,
    surgeMultiplier: ride.surgeMultiplier,
    paymentMethod: ride.paymentMethod as unknown as PaymentMethod,
    startPin: ride.startPin,
    sharedGroupId: ride.sharedGroupId,
    createdAt: ride.createdAt.toISOString(),
    timeline: ride.timeline as unknown as RideTimelineEntry[],
    driver: ride.driver ? toRideDriverInfo(ride.driver) : null,
  };
}

function toRideDriverInfo(
  driver: PrismaUser & { driverProfile: PrismaDriverProfile | null },
): RideDriverInfo | null {
  if (!driver.driverProfile) return null;

  return {
    userId: driver.id,
    name: driver.name,
    plateNumber: driver.driverProfile.plateNumber,
    vehicleModel: driver.driverProfile.vehicleModel,
    color: driver.driverProfile.color,
    verification: driver.driverProfile
      .verification as unknown as VerificationStatus,
    helmetProvided: driver.driverProfile.helmetProvided,
    ratingAvg: driver.driverProfile.ratingAvg,
    ratingCount: driver.driverProfile.ratingCount,
  };
}
