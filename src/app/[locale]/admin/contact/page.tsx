import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/config";
import { buildAlternateLanguages, buildLocalizedUrl, defaultOgImageUrl } from "@/lib/seo";

import { ContactMessagesClient } from "./ContactMessagesClient";

const metadataContent = {
  title: "Contact messages | Admin | Fish Your Style",
  description: "Review recent contact form submissions.",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const url = buildLocalizedUrl(locale, "/admin/contact");
  const ogImages = [defaultOgImageUrl];

  return {
    ...metadataContent,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages("/admin/contact"),
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

export default function ContactMessagesPage() {
  return <ContactMessagesClient />;
}
