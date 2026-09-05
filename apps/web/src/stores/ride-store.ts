import { create } from "zustand";
import {
  SOCKET_EVENTS,
  type DriverLocationPayload,
  type RideDetail,
  type RideStatusPayload,
  type RideTakenPayload,
} from "@vora/shared";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

export interface DriverPoint {
  lat: number;
  lng: number;
}

interface RideState {
  activeRide: RideDetail | null;
  incomingRequest: RideDetail | null;
  driverLocation: DriverPoint | null;
  isOnline: boolean;

  connect: (token: string) => void;
  disconnect: () => void;

  setActiveRide: (ride: RideDetail | null) => void;
  subscribeToRide: (rideId: string) => void;
  dismissIncomingRequest: () => void;

  acceptRide: (rideId: string) => void;
  markArrived: (rideId: string) => void;
  startTrip: (rideId: string) => void;
  completeTrip: (rideId: string) => void;
  cancelRide: (rideId: string) => void;

  goOnline: (lat: number, lng: number) => void;
  goOffline: () => void;
  sendLocation: (lat: number, lng: number) => void;
}

export const useRideStore = create<RideState>()((set) => ({
  activeRide: null,
  incomingRequest: null,
  driverLocation: null,
  isOnline: false,

  connect: (token) => {
    const socket = connectSocket(token);

    // connect() can be called again after a token refresh — clear any
    // previously bound listeners so events don't fire twice.
    socket.off(SOCKET_EVENTS.RIDE_REQUEST);
    socket.off(SOCKET_EVENTS.RIDE_ACCEPTED);
    socket.off(SOCKET_EVENTS.RIDE_TAKEN);
    socket.off(SOCKET_EVENTS.RIDE_STATUS);
    socket.off(SOCKET_EVENTS.DRIVER_LOCATION);

    socket.on(SOCKET_EVENTS.RIDE_REQUEST, (ride: RideDetail) => {
      set({ incomingRequest: ride });
    });

    socket.on(SOCKET_EVENTS.RIDE_ACCEPTED, (ride: RideDetail) => {
      set((state) => ({
        activeRide: ride,
        incomingRequest:
          state.incomingRequest?.id === ride.id ? null : state.incomingRequest,
      }));
    });

    socket.on(SOCKET_EVENTS.RIDE_TAKEN, (payload: RideTakenPayload) => {
      set((state) =>
        state.incomingRequest?.id === payload.rideId
          ? { incomingRequest: null }
          : {},
      );
    });

    socket.on(SOCKET_EVENTS.RIDE_STATUS, (payload: RideStatusPayload) => {
      set((state) => {
        if (!state.activeRide || state.activeRide.id !== payload.rideId) {
          return {};
        }
        return {
          activeRide: {
            ...state.activeRide,
            status: payload.status,
            timeline: payload.timeline,
          },
        };
      });
    });

    socket.on(SOCKET_EVENTS.DRIVER_LOCATION, (payload: DriverLocationPayload) => {
      set({ driverLocation: { lat: payload.lat, lng: payload.lng } });
    });
  },

  disconnect: () => {
    disconnectSocket();
    set({
      activeRide: null,
      incomingRequest: null,
      driverLocation: null,
      isOnline: false,
    });
  },

  setActiveRide: (ride) => set({ activeRide: ride }),

  subscribeToRide: (rideId) => {
    getSocket()?.emit(SOCKET_EVENTS.RIDE_SUBSCRIBE, { rideId });
  },

  dismissIncomingRequest: () => set({ incomingRequest: null }),

  acceptRide: (rideId) => {
    getSocket()?.emit(SOCKET_EVENTS.RIDE_ACCEPT, { rideId });
  },
  markArrived: (rideId) => {
    getSocket()?.emit(SOCKET_EVENTS.RIDE_ARRIVED, { rideId });
  },
  startTrip: (rideId) => {
    getSocket()?.emit(SOCKET_EVENTS.RIDE_START, { rideId });
  },
  completeTrip: (rideId) => {
    getSocket()?.emit(SOCKET_EVENTS.RIDE_COMPLETE, { rideId });
  },
  cancelRide: (rideId) => {
    getSocket()?.emit(SOCKET_EVENTS.RIDE_CANCEL, { rideId });
  },

  goOnline: (lat, lng) => {
    getSocket()?.emit(SOCKET_EVENTS.DRIVER_ONLINE, { lat, lng });
    set({ isOnline: true });
  },
  goOffline: () => {
    getSocket()?.emit(SOCKET_EVENTS.DRIVER_OFFLINE);
    set({ isOnline: false });
  },
  sendLocation: (lat, lng) => {
    getSocket()?.emit(SOCKET_EVENTS.DRIVER_LOCATION, { lat, lng });
  },
}));
