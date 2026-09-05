"use client";

import { Role } from "@vora/shared";
import { DriverHomeScreen } from "@/components/vora/driver/driver-home-screen";
import { HomeScreen, type HomeScreenCopy } from "@/components/vora/home-screen";
import { useAuthStore } from "@/stores/auth-store";

/** Rider/driver mode is one role toggle in this build (§8 branch 1), so the same login routes here. */
export function AppShell({ copy }: { copy: HomeScreenCopy }) {
  const role = useAuthStore((s) => s.user?.role);

  if (role === Role.DRIVER) {
    return <DriverHomeScreen />;
  }

  return <HomeScreen copy={copy} />;
}
