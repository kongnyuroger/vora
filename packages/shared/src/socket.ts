/**
 * Shared Socket.IO event names for the rides realtime channel.
 * Keeping these as constants (imported by both apps/api and apps/web)
 * avoids event-name typos silently breaking a listener at runtime.
 */
export const SOCKET_EVENTS = {
  // Client -> server
  DRIVER_ONLINE: "driver:online",
  DRIVER_OFFLINE: "driver:offline",
  DRIVER_LOCATION: "driver:location",
  RIDE_SUBSCRIBE: "ride:subscribe",
  RIDE_ACCEPT: "ride:accept",
  RIDE_ARRIVED: "ride:arrived",
  RIDE_START: "ride:start",
  RIDE_COMPLETE: "ride:complete",
  RIDE_CANCEL: "ride:cancel",
  RIDE_SOS: "ride:sos",

  // Server -> client
  RIDE_REQUEST: "ride:request",
  RIDE_ACCEPTED: "ride:accepted",
  RIDE_TAKEN: "ride:taken",
  RIDE_STATUS: "ride:status",
  RIDE_SAFETY_ALERT: "ride:safety-alert",
  PAYMENT_STATUS: "payment:status",
  ERROR: "error",
} as const;
