import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/config";
import { buildAlternateLanguages, buildLocalizedUrl, defaultOgImageUrl, privateRobots } from "@/lib/seo";

import AccountClient from "./AccountClient";

const metadataContent = {
  title: "Account | Fish Your Style",
  description: "Access your Fish Your Style account and order history.",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const url = buildLocalizedUrl(locale, "/account");
  const ogImages = [defaultOgImageUrl];

  return {
    ...metadataContent,
    robots: privateRobots,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages("/account"),
    },
    openGraph: {
      ...metadataContent,
      url,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      ...metadataContent,
      images: ogImages,
    },
  };
}

export default function AccountPage() {
  return <AccountClient />;
}
