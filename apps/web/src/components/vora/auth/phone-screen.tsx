"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@vora/shared";
import { Button } from "@/components/ui/button";
import { RoleToggle } from "./role-toggle";

interface PhoneScreenProps {
  isPending: boolean;
  hasError?: boolean;
  onSubmit: (phone: string, role: Role.RIDER | Role.DRIVER) => void;
}

export function PhoneScreen({
  isPending,
  hasError,
  onSubmit,
}: PhoneScreenProps) {
  const t = useTranslations("Auth.phone");
  const [role, setRole] = useState<Role.RIDER | Role.DRIVER>(Role.RIDER);
  const [digits, setDigits] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = /^\d{9}$/.test(digits);

  return (
    <div className="flex h-dvh w-full flex-col justify-center bg-vora-bg px-6">
      <div className="mx-auto w-full max-w-sm rounded-card bg-card p-6 shadow-vora-soft">
        <span className="font-heading text-h2 font-bold tracking-tight text-vora-green">
          VORA
        </span>
        <h1 className="mt-4 font-heading text-h3 font-semibold text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          {t("subtitle")}
        </p>

        <div className="mt-6">
          <RoleToggle
            value={role}
            onChange={setRole}
            riderLabel={t("roleRider")}
            driverLabel={t("roleDriver")}
          />
        </div>

        <div className="mt-6">
          <label
            htmlFor="phone"
            className="mb-1.5 block text-caption font-medium text-muted-foreground"
          >
            {t("phoneLabel")}
          </label>
          <div className="flex items-center gap-2 rounded-card border border-border bg-background px-4 py-3 focus-within:border-ring">
            <span className="text-body font-medium text-foreground">
              +237
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="6XX XXX XXX"
              value={digits}
              onChange={(e) => {
                setDigits(e.target.value.replace(/\D/g, "").slice(0, 9));
                setTouched(true);
              }}
              className="flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          {touched && !isValid && (
            <p className="mt-1.5 text-caption text-destructive">
              {t("errorInvalid")}
            </p>
          )}
        </div>

        {hasError && (
          <p className="mt-4 text-caption text-destructive">
            {t("errorGeneric")}
          </p>
        )}

        <Button
          size="cta"
          className="mt-6 w-full"
          disabled={!isValid || isPending}
          onClick={() => onSubmit(`+237${digits}`, role)}
        >
          {isPending ? t("sending") : t("continue")}
        </Button>
      </div>
    </div>
  );
}
