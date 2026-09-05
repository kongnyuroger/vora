import { getTranslations } from "next-intl/server";
import { HomeScreen } from "@/components/vora/home-screen";

export default async function Home() {
  const t = await getTranslations("Home");

  return (
    <HomeScreen
      copy={{
        title: t("title"),
        tagline: t("tagline"),
        cta: t("cta"),
        scaffoldNotice: t("scaffoldNotice"),
      }}
    />
  );
}
