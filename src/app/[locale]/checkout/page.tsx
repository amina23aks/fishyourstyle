import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/config";
import { buildAlternateLanguages, buildLocalizedUrl, resolveOgImageUrl } from "@/lib/seo";
import CheckoutClient from "./CheckoutClient";

const metadataContent = {
  title: "Checkout | Fish Your Style",
  description: "Complete your Fish Your Style order securely.",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const url = buildLocalizedUrl(locale, "/checkout");
  const ogImages = [resolveOgImageUrl("/outphoto.webp"), resolveOgImageUrl("/outphoto.PNG")];

  return {
    ...metadataContent,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages("/checkout"),
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

export default function CheckoutPage() {
  return <CheckoutClient />;
}
