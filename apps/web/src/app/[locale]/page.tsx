import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/vora/app-shell";
import { AuthGate } from "@/components/vora/auth-gate";

export default async function Home() {
  const t = await getTranslations("Home");

  return (
    <AuthGate>
      <AppShell
        copy={{
          title: t("title"),
          tagline: t("tagline"),
          cta: t("cta"),
          scaffoldNotice: t("scaffoldNotice"),
        }}
      />
    </AuthGate>
  );
}
