"use client";

import { useAuthStore } from "@/stores/auth-store";
import { AuthFlow } from "./auth/auth-flow";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);

  if (!hasHydrated) {
    return <div className="h-dvh w-full animate-pulse bg-vora-bg" />;
  }

  if (!user) {
    return <AuthFlow />;
  }

  return <>{children}</>;
}
