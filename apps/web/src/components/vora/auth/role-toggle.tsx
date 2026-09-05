"use client";

import { Role } from "@vora/shared";
import { cn } from "@/lib/utils";

interface RoleToggleProps {
  value: Role.RIDER | Role.DRIVER;
  onChange: (role: Role.RIDER | Role.DRIVER) => void;
  riderLabel: string;
  driverLabel: string;
}

export function RoleToggle({
  value,
  onChange,
  riderLabel,
  driverLabel,
}: RoleToggleProps) {
  return (
    <div className="flex rounded-full bg-muted p-1">
      {(
        [
          [Role.RIDER, riderLabel],
          [Role.DRIVER, driverLabel],
        ] as const
      ).map(([role, label]) => (
        <button
          key={role}
          type="button"
          onClick={() => onChange(role)}
          className={cn(
            "flex-1 rounded-full px-4 py-2.5 text-body font-medium transition-colors",
            value === role
              ? "bg-primary text-primary-foreground shadow-vora-soft"
              : "text-muted-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
