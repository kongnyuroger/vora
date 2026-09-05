"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Role } from "@vora/shared";
import { requestOtp, verifyOtp } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { PhoneScreen } from "./phone-screen";
import { OtpScreen } from "./otp-screen";

export function AuthFlow() {
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState<string | null>(null);
  const [role, setRole] = useState<Role.RIDER | Role.DRIVER>(Role.RIDER);
  const [devOtp, setDevOtp] = useState<string | undefined>();

  const requestMutation = useMutation({
    mutationFn: ({
      phone,
      role,
    }: {
      phone: string;
      role: Role.RIDER | Role.DRIVER;
    }) => requestOtp({ phone, role }),
    onSuccess: (res, variables) => {
      setPhone(variables.phone);
      setRole(variables.role);
      setDevOtp(res.devOtp);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => verifyOtp({ phone: phone!, otp }),
    onSuccess: (session) => {
      setSession(session.accessToken, session.user);
    },
  });

  if (!phone) {
    return (
      <PhoneScreen
        isPending={requestMutation.isPending}
        onSubmit={(phone, role) => requestMutation.mutate({ phone, role })}
      />
    );
  }

  return (
    <OtpScreen
      phone={phone}
      devOtp={devOtp}
      isPending={verifyMutation.isPending}
      hasError={verifyMutation.isError}
      onBack={() => {
        setPhone(null);
        verifyMutation.reset();
      }}
      onResend={() => requestMutation.mutate({ phone, role })}
      onSubmit={(otp) => verifyMutation.mutate(otp)}
    />
  );
}
