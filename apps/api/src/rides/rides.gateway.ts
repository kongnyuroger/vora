import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  RideStatus,
  Role,
  SafetyEventType,
  SOCKET_EVENTS,
  type DriverLocationPayload,
  type PaymentStatusPayload,
  type RideDetail,
  type RideStatusPayload,
  type RideTakenPayload,
  type SafetyAlertPayload,
} from '@vora/shared';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/auth.service';
import { PaymentsService } from '../payments/payments.service';
import { RidesService } from './rides.service';

interface SocketUser {
  userId: string;
  role: Role;
}

interface SocketData {
  user?: SocketUser;
  activeRideId?: string;
}

// `Socket.data` is typed `any` upstream, which would otherwise swallow our
// intersection back down to `any` — Omit it before adding the real type.
type AppSocket = Omit<Socket, 'data'> & { data: SocketData };

function rideRoom(rideId: string): string {
  return `ride:${rideId}`;
}

function driverRoom(driverId: string): string {
  return `driver:${driverId}`;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RidesGateway.name);

  constructor(
    private readonly rides: RidesService,
    private readonly payments: PaymentsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: AppSocket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
      });
      const user: SocketUser = {
        userId: payload.sub,
        role: payload.role as unknown as Role,
      };
      client.data.user = user;

      if (user.role === Role.DRIVER) {
        await client.join(driverRoom(user.userId));
      }
      this.logger.log(`Socket connected: ${user.userId} (${user.role})`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AppSocket) {
    const user = client.data.user;
    if (user?.role === Role.DRIVER) {
      // Best-effort: assumes one active connection per driver, true for
      // this hackathon build (no multi-device driver sessions).
      await this.rides.setDriverOffline(user.userId);
      this.logger.log(`Driver ${user.userId} went offline (disconnect)`);
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.DRIVER_ONLINE)
  async onDriverOnline(client: AppSocket, body: { lat: number; lng: number }) {
    const user = this.requireUser(client, Role.DRIVER);
    if (!user || !isFinitePoint(body)) return;

    await this.rides.setDriverOnline(user.userId, body.lat, body.lng);
  }

  @SubscribeMessage(SOCKET_EVENTS.DRIVER_OFFLINE)
  async onDriverOffline(client: AppSocket) {
    const user = this.requireUser(client, Role.DRIVER);
    if (!user) return;

    await this.rides.setDriverOffline(user.userId);
  }

  @SubscribeMessage(SOCKET_EVENTS.DRIVER_LOCATION)
  async onDriverLocation(
    client: AppSocket,
    body: { lat: number; lng: number },
  ) {
    const user = this.requireUser(client, Role.DRIVER);
    if (!user || !isFinitePoint(body)) return;

    await this.rides.updateDriverLocation(user.userId, body.lat, body.lng);

    const activeRideId = client.data.activeRideId;
    if (activeRideId) {
      const payload: DriverLocationPayload = {
        rideId: activeRideId,
        lat: body.lat,
        lng: body.lng,
      };
      this.server
        .to(rideRoom(activeRideId))
        .emit(SOCKET_EVENTS.DRIVER_LOCATION, payload);
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.RIDE_SUBSCRIBE)
  async onRideSubscribe(client: AppSocket, body: { rideId: string }) {
    const user = this.requireUser(client);
    if (!user || !body?.rideId) return;

    try {
      const ride = await this.rides.getRideForParticipant(
        body.rideId,
        user.userId,
      );
      await client.join(rideRoom(body.rideId));
      if (user.role === Role.DRIVER && ride.driverId === user.userId) {
        client.data.activeRideId = body.rideId;
      }
    } catch (err) {
      this.emitError(client, this.errorMessage(err));
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.RIDE_ACCEPT)
  async onRideAccept(client: AppSocket, body: { rideId: string }) {
    const user = this.requireUser(client, Role.DRIVER);
    if (!user || !body?.rideId) return;

    const ride = await this.rides.tryClaimRide(body.rideId, user.userId);
    if (!ride) {
      this.logger.log(
        `Ride ${body.rideId} already claimed — ${user.userId} lost the race`,
      );
      const payload: RideTakenPayload = { rideId: body.rideId };
      client.emit(SOCKET_EVENTS.RIDE_TAKEN, payload);
      return;
    }

    await client.join(rideRoom(body.rideId));
    client.data.activeRideId = body.rideId;
    this.logger.log(`Ride ${body.rideId} accepted by driver ${user.userId}`);
    this.server
      .to(rideRoom(body.rideId))
      .emit(SOCKET_EVENTS.RIDE_ACCEPTED, ride);
  }

  @SubscribeMessage(SOCKET_EVENTS.RIDE_ARRIVED)
  async onRideArrived(client: AppSocket, body: { rideId: string }) {
    await this.handleDriverTransition(
      client,
      body?.rideId,
      RideStatus.ARRIVING,
      RideStatus.ARRIVED,
    );
  }

  @SubscribeMessage(SOCKET_EVENTS.RIDE_START)
  async onRideStart(client: AppSocket, body: { rideId: string }) {
    await this.handleDriverTransition(
      client,
      body?.rideId,
      RideStatus.ARRIVED,
      RideStatus.IN_PROGRESS,
    );
  }

  @SubscribeMessage(SOCKET_EVENTS.RIDE_COMPLETE)
  async onRideComplete(client: AppSocket, body: { rideId: string }) {
    const ride = await this.handleDriverTransition(
      client,
      body?.rideId,
      RideStatus.IN_PROGRESS,
      RideStatus.COMPLETED,
    );
    if (!ride) return;

    if (client.data.activeRideId === ride.id) {
      client.data.activeRideId = undefined;
    }

    // Both sides of the ride room need the outcome: the rider to see whether
    // the fare is settled or still waiting on a MoMo prompt, the driver to
    // know whether to collect cash.
    const payment = await this.payments.settleRide(ride.id);
    const payload: PaymentStatusPayload = { rideId: ride.id, payment };
    this.server
      .to(rideRoom(ride.id))
      .emit(SOCKET_EVENTS.PAYMENT_STATUS, payload);
  }

  @SubscribeMessage(SOCKET_EVENTS.RIDE_SOS)
  async onSos(
    client: AppSocket,
    body: { rideId: string; lat: number; lng: number },
  ) {
    const user = this.requireUser(client);
    if (!user || !body?.rideId || !isFinitePoint(body)) return;

    try {
      await this.rides.recordSafetyEvent(
        body.rideId,
        user.userId,
        SafetyEventType.SOS,
        body.lat,
        body.lng,
      );
      const payload: SafetyAlertPayload = {
        rideId: body.rideId,
        type: SafetyEventType.SOS,
        at: new Date().toISOString(),
      };
      this.server
        .to(rideRoom(body.rideId))
        .emit(SOCKET_EVENTS.RIDE_SAFETY_ALERT, payload);
      this.logger.log(`SOS raised on ride ${body.rideId} by ${user.userId}`);
    } catch (err) {
      this.emitError(client, this.errorMessage(err));
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.RIDE_CANCEL)
  async onRideCancel(client: AppSocket, body: { rideId: string }) {
    const user = this.requireUser(client);
    if (!user || !body?.rideId) return;

    try {
      const ride = await this.rides.cancelRide(body.rideId, user.userId);
      this.emitStatus(ride);
      if (client.data.activeRideId === body.rideId) {
        client.data.activeRideId = undefined;
      }
    } catch (err) {
      this.emitError(client, this.errorMessage(err));
    }
  }

  /** Called by RidesController right after a ride is created. */
  broadcastRideRequest(ride: RideDetail, candidateDriverIds: string[]) {
    for (const driverId of candidateDriverIds) {
      this.server
        .to(driverRoom(driverId))
        .emit(SOCKET_EVENTS.RIDE_REQUEST, ride);
    }
  }

  /** Returns the updated ride, or null if the transition was rejected. */
  private async handleDriverTransition(
    client: AppSocket,
    rideId: string | undefined,
    from: RideStatus,
    to: RideStatus,
  ): Promise<RideDetail | null> {
    const user = this.requireUser(client, Role.DRIVER);
    if (!user || !rideId) return null;

    try {
      const ride = await this.rides.advanceStatus(
        rideId,
        user.userId,
        from,
        to,
      );
      this.emitStatus(ride);
      return ride;
    } catch (err) {
      this.emitError(client, this.errorMessage(err));
      return null;
    }
  }

  private emitStatus(ride: RideDetail) {
    const payload: RideStatusPayload = {
      rideId: ride.id,
      status: ride.status,
      timeline: ride.timeline,
    };
    this.server.to(rideRoom(ride.id)).emit(SOCKET_EVENTS.RIDE_STATUS, payload);
    // ride:accepted already carries the full RideDetail with driver info;
    // status-only updates afterwards just need the lighter payload above.
  }

  private requireUser(
    client: AppSocket,
    requireRole?: Role,
  ): SocketUser | null {
    const user = client.data.user;
    if (!user) {
      this.emitError(client, 'Not authenticated');
      return null;
    }
    if (requireRole && user.role !== requireRole) {
      this.emitError(client, `Requires role ${requireRole}`);
      return null;
    }
    return user;
  }

  private emitError(client: AppSocket, message: string) {
    client.emit(SOCKET_EVENTS.ERROR, { message });
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'Unexpected error';
  }
}

function isFinitePoint(body: unknown): body is { lat: number; lng: number } {
  const b = body as { lat?: unknown; lng?: unknown } | null;
  return (
    !!b &&
    typeof b.lat === 'number' &&
    typeof b.lng === 'number' &&
    Number.isFinite(b.lat) &&
    Number.isFinite(b.lng)
  );
}
