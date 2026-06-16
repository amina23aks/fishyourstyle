import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import FeaturedDropSection, {
  type FeaturedDropConfig,
} from "@/components/FeaturedDropSection";
import FAQAccordion from "@/components/FAQAccordion";
import DropUpdatesSection from "@/components/DropUpdatesSection";
import { faqItems } from "@/data/faqItems";
import HomeClient from "./home-client";
import { resolveLocale, type Locale } from "@/i18n/config";
import { localizePathname } from "@/i18n/paths";
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
  fetchStorefrontProductsByFeaturedDrop,
  fetchStorefrontProductsPage,
  type StorefrontProduct,
} from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import {
  getSelectableCollections,
  getSelectableDesigns,
} from "@/lib/categories";
import { getHomeSettings } from "@/lib/home-settings";

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

function mapStorefrontToProduct(sp: StorefrontProduct): Product {
  const mainImage = sp.images?.main || "/placeholder.png";
  const gallery = sp.images?.gallery ?? [];
  const colors = (sp.colors ?? []).map((color) => {
    if (typeof color === "string") {
      return { id: color, labelFr: color, labelAr: color, image: mainImage };
    }
    const id = typeof color.id === "string" && color.id ? color.id : mainImage;
    const labelFr =
      typeof color.labelFr === "string" && color.labelFr ? color.labelFr : id;
    const labelAr =
      typeof color.labelAr === "string" && color.labelAr
        ? color.labelAr
        : labelFr;
    const image =
      typeof color.image === "string" && color.image ? color.image : mainImage;
    return { id, labelFr, labelAr, image };
  });
  return {
    id: sp.id,
    slug: sp.slug,
    nameFr: sp.name,
    nameAr: sp.name,
    category: sp.category,
    kind: sp.category,
    fit: "regular",
    priceDzd: sp.finalPrice ?? sp.basePrice,
    currency: "DZD",
    gender: sp.gender ?? "",
    sizes: sp.sizes ?? [],
    colors,
    soldOutSizes: sp.soldOutSizes,
    soldOutColorCodes: sp.soldOutColorCodes,
    sizeGuideEnabled: sp.sizeGuideEnabled ?? false,
    sizeGuideImageUrl: sp.sizeGuideImageUrl ?? null,
    sizeGuideImagePublicId: sp.sizeGuideImagePublicId ?? null,
    images: { main: mainImage, gallery },
    descriptionFr: sp.description ?? "",
    descriptionAr: sp.description ?? "",
    status: "active",
    designTheme: sp.designTheme || "simple",
    tags: sp.tags ?? [],
    discountPercent: sp.discountPercent ?? 0,
    stockMode: sp.stockMode,
    stockQty: sp.stockQty,
    inStock: sp.inStock ?? true,
  } as Product & {
    designTheme?: string;
    tags?: string[];
    discountPercent?: number;
    stockMode?: "unlimited" | "limited";
    stockQty?: number;
    inStock?: boolean;
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const messages = await getMessages(locale);
  const t = createTranslator(messages);
  const homeSettings = await getHomeSettings();
  const flowDropConfig: FeaturedDropConfig = homeSettings.featuredDrop;
  const featuredProducts =
    homeSettings.showFeaturedDrop && flowDropConfig.active
      ? await fetchStorefrontProductsByFeaturedDrop({
          slug: homeSettings.featuredDropSlug,
          pageSize: flowDropConfig.maxProducts,
        }).catch((error) => {
          console.error("Failed to fetch featured drop products:", error);
          return [];
        })
      : [];

  let shopPreviewErrorMessage: string | null = null;
  let shopPreviewCategories: Awaited<
    ReturnType<typeof getSelectableCollections>
  > = [];
  let shopPreviewDesignThemes: Awaited<
    ReturnType<typeof getSelectableDesigns>
  > = [];
  const shopPreviewProducts = homeSettings.showHomeShopSection
    ? await fetchStorefrontProductsPage({ pageSize: 8 })
        .then((page) => page.products.map(mapStorefrontToProduct))
        .catch((error) => {
          console.error(
            "Failed to fetch homepage shop preview products:",
            error,
          );
          shopPreviewErrorMessage = "Products are temporarily unavailable.";
          return [];
        })
    : [];

  if (homeSettings.showHomeShopSection) {
    try {
      shopPreviewCategories = await getSelectableCollections();
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      shopPreviewCategories = [];
    }
    try {
      shopPreviewDesignThemes = await getSelectableDesigns();
    } catch (error) {
      console.error("Failed to fetch design themes:", error);
      shopPreviewDesignThemes = [];
    }
  }

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
        {homeSettings.showFeaturedDrop ? (
          <FeaturedDropSection
            drop={flowDropConfig}
            products={featuredProducts}
          />
        ) : null}

        {homeSettings.showHomeShopSection ? (
          <section className="space-y-4" id="shop-search">
            <div className="flex flex-col gap-2 md:max-w-2xl">
              <p className="text-sm uppercase tracking-[0.28em] text-white/90">
                {t("shop.headerEyebrow")}
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {t("shop.headerTitle")}
              </h2>
              <p className="text-white/80">
                {t("shop.headerDescriptionLine1")}
                <br />
                {t("shop.headerDescriptionLine2")}
              </p>
            </div>

            <HomeClient
              products={shopPreviewProducts}
              categories={shopPreviewCategories}
              designThemes={shopPreviewDesignThemes}
            />
            {shopPreviewErrorMessage ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {shopPreviewErrorMessage}
              </div>
            ) : null}

            <div className="flex w-full justify-center pt-2">
              <Link
                href={localizePathname(locale, "/shop")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-black/30 transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                {t("shop.exploreMoreCta")}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </section>
        ) : null}

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

        <DropUpdatesSection />

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
