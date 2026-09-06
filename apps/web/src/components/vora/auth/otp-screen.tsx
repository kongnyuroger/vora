"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OtpErrorKind = "invalid" | "generic" | null;

interface OtpScreenProps {
  phone: string;
  devOtp?: string;
  isPending: boolean;
  errorKind: OtpErrorKind;
  onBack: () => void;
  onResend: () => void;
  onSubmit: (otp: string) => void;
}

const LENGTH = 6;

export function OtpScreen({
  phone,
  devOtp,
  isPending,
  errorKind,
  onBack,
  onResend,
  onSubmit,
}: OtpScreenProps) {
  const t = useTranslations("Auth.otp");
  const [values, setValues] = useState<string[]>(Array(LENGTH).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    if (digit && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      onSubmit(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.slice(0, LENGTH).split("");
    while (next.length < LENGTH) next.push("");
    setValues(next);
    if (pasted.length >= LENGTH) onSubmit(pasted.slice(0, LENGTH));
    else inputs.current[pasted.length]?.focus();
  };

  return (
    <div className="flex h-dvh w-full flex-col justify-center bg-vora-bg px-6">
      <div className="mx-auto w-full max-w-sm rounded-card bg-card p-6 shadow-vora-soft">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("changeNumber")}
        </button>

        <h1 className="mt-4 font-heading text-h3 font-semibold text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          {t("subtitle", { phone })}
        </p>

        {devOtp && (
          <div className="mt-4 rounded-card bg-vora-amber-100 px-4 py-2.5 text-caption font-medium text-vora-green-700">
            {t("devHint")}{" "}
            <span className="font-heading text-body font-bold tracking-widest">
              {devOtp}
            </span>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-2">
          {values.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={cn(
                "size-12 rounded-card border border-border bg-background text-center text-h3 font-semibold text-foreground outline-none focus:border-ring",
                errorKind && "border-destructive",
              )}
            />
          ))}
        </div>

        {errorKind && (
          <p className="mt-3 text-caption text-destructive">
            {errorKind === "invalid" ? t("errorInvalid") : t("errorGeneric")}
          </p>
        )}

        <Button
          size="cta"
          className="mt-6 w-full"
          disabled={isPending || values.some((d) => d === "")}
          onClick={() => onSubmit(values.join(""))}
        >
          {isPending ? t("verifying") : t("verify")}
        </Button>

        <button
          type="button"
          onClick={onResend}
          className="mt-4 w-full text-center text-caption font-medium text-vora-green"
        >
          {t("resend")}
        </button>
      </div>
    </div>
  );
}
