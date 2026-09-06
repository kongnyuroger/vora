import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrackScreen } from "@/components/vora/track/track-screen";

/** A shared link is opened in a fresh tab, so the tab has to say what it is. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Track" });

  return { title: `${t("title")} · VORA`, description: t("subtitle") };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TrackScreen rideId={id} />;
}
