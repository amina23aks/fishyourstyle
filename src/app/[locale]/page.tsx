import type { Metadata } from "next";
import Image from "next/image";
import Hero from "@/components/Hero";
import FeaturedDropSection, {
  type FeaturedDropConfig,
} from "@/components/FeaturedDropSection";
import FAQAccordion from "@/components/FAQAccordion";
import { faqItems } from "@/data/faqItems";
import { resolveLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { createTranslator } from "@/i18n/translator";
import {
  buildAlternateLanguages,
  buildLocalizedUrl,
  brandLogoUrl,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getDefaultSocialImages,
  siteName,
  siteUrl,
} from "@/lib/seo";
import {
  fetchStorefrontProductsByIds,
  fetchStorefrontProductsPage,
} from "@/lib/storefront-products";

export const revalidate = 300;

const homeMetadataByLocale: Record<
  Locale,
  { title: string; description: string }
> = {
  en: {
    title: "Fish Your Style — FLOW DROP 01",
    description:
      "Discover FLOW — DROP 01, the first Fish Your Style chapter inspired by finding your own rhythm.",
  },
  fr: {
    title: "Fish Your Style — FLOW DROP 01",
    description:
      "Découvrez FLOW — DROP 01, le premier chapitre Fish Your Style inspiré par votre propre rythme.",
  },
  ar: {
    title: "Fish Your Style — FLOW DROP 01",
    description:
      "اكتشف FLOW — DROP 01، الفصل الأول من Fish Your Style لإيجاد إيقاعك الخاص.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { title, description } = homeMetadataByLocale[locale];
  const url = buildLocalizedUrl(locale, "/");
  const ogImages = getDefaultSocialImages();

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages("/"),
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName,
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}

const flowDropConfig: FeaturedDropConfig = {
  title: "FLOW — DROP 01",
  subtitle:
    "The first chapter of Fish Your Style. A collection inspired by finding your own rhythm.",
  label: "Find Your Flow.",
  buttonText: "Discover FLOW",
  buttonLink: "/shop",
  selectedProductIds: [],
  isActive: true,
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const messages = await getMessages(locale);
  const t = createTranslator(messages);
  const featuredProducts = await (
    flowDropConfig.selectedProductIds.length > 0
      ? fetchStorefrontProductsByIds(flowDropConfig.selectedProductIds)
      : fetchStorefrontProductsPage({ pageSize: 4 }).then(
          (page) => page.products,
        )
  ).catch((error) => {
    console.error("Failed to fetch featured drop products:", error);
    return [];
  });

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: brandLogoUrl,
  };
  const reasons = [
    {
      title: t("whyUs.deliveryTitle"),
      description: t("whyUs.deliveryDescription"),
      icon: "/delivery.gif",
    },
    {
      title: t("whyUs.qualityTitle"),
      description: t("whyUs.qualityDescription"),
      icon: "/quality.gif",
    },
    {
      title: t("whyUs.orderingTitle"),
      description: t("whyUs.orderingDescription"),
      icon: "/order.gif",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />
      <div dir="ltr" className="text-left">
        <Hero />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-12 sm:px-6 lg:px-8">
        <FeaturedDropSection
          drop={flowDropConfig}
          locale={locale}
          products={featuredProducts}
        />

        <section className="space-y-8 rounded-3xl bg-sky-900/90 px-6 py-14 text-sky-50 shadow-lg shadow-sky-200/60 md:px-10">
          <div className="flex flex-col gap-3">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200">
              {t("whyUs.eyebrow")}
            </p>
            <h2 className="text-2xl font-semibold">{t("whyUs.title")}</h2>
            <p className="text-sky-100">{t("whyUs.subtitle")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="group flex h-full flex-col items-center rounded-3xl border border-white/20 bg-white/15 p-7 text-center shadow-[0_12px_30px_rgba(15,23,42,0.45)] backdrop-blur transition hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-[0_16px_40px_rgba(56,189,248,0.35)]"
              >
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/30 bg-white/10 shadow-inner shadow-sky-950/40">
                  <Image
                    src={reason.icon}
                    alt={reason.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {reason.title}
                </h3>
                <p className="mt-3 text-sm text-sky-100/90">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-200/40 to-transparent" />
          <section
            id="faq"
            className="rounded-3xl border border-white/15 bg-sky-950/40 px-6 py-12 text-sky-50 shadow-[0_12px_30px_rgba(15,23,42,0.45)] backdrop-blur md:px-10"
          >
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200">
                FAQ
              </p>
              <h3 className="text-xl font-semibold text-white">أسئلة متكررة</h3>
              <p className="text-sm text-sky-100">
                إجابات مختصرة لأكثر الأسئلة شيوعًا.
              </p>
            </div>
            <div className="mt-6">
              <FAQAccordion items={faqItems} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
