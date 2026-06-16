import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import FeaturedDropSection, {
  type FeaturedDropConfig,
} from "@/components/FeaturedDropSection";
import FAQAccordion from "@/components/FAQAccordion";
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


        <section className="overflow-hidden rounded-[2rem] border border-cyan-100/20 bg-[radial-gradient(circle_at_18%_0%,rgba(125,211,252,0.28),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,#063a5b_0%,#0b5f86_46%,#0d83ad_100%)] px-6 py-14 text-center text-sky-50 shadow-[0_28px_70px_rgba(8,47,73,0.42)] md:px-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              DROP UPDATES
            </p>
            <h2 className="mt-3 text-4xl font-extrabold uppercase tracking-[-0.02em] text-white sm:text-5xl">
              STAY IN THE CURRENT
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-sky-50/82">
              Be first to know about new drops, restocks, and exclusive updates.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "NEW DROPS",
                body: "Fresh coastal pieces the moment they surface.",
                icon: "sparkle",
              },
              {
                title: "EARLY ACCESS",
                body: "Private first looks before a chapter goes public.",
                icon: "mail",
              },
              {
                title: "RESTOCK ALERTS",
                body: "Quiet reminders when favorites return in limited runs.",
                icon: "bell",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.6rem] border border-white/18 bg-white/[0.12] p-6 text-center shadow-[0_18px_45px_rgba(7,47,72,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-100/35 hover:bg-white/[0.16]"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100/24 bg-cyan-50/10 text-cyan-50 shadow-inner shadow-sky-950/20">
                  {item.icon === "sparkle" ? (
                    <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" aria-hidden="true">
                      <path d="M24 6l3.6 10.8L38 20.4l-10.4 3.8L24 35l-3.6-10.8L10 20.4l10.4-3.6L24 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M38 30l1.6 4.4L44 36l-4.4 1.6L38 42l-1.6-4.4L32 36l4.4-1.6L38 30Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  ) : item.icon === "mail" ? (
                    <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" aria-hidden="true">
                      <rect x="9" y="14" width="30" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M11 17l13 10 13-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" aria-hidden="true">
                      <path d="M16 22a8 8 0 0 1 16 0c0 8 4 9 4 12H12c0-3 4-4 4-12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 38a3.5 3.5 0 0 0 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-sky-50/74">{item.body}</p>
              </div>
            ))}
          </div>

          <form className="mx-auto mt-9 flex max-w-xl flex-col gap-3 rounded-full border border-white/16 bg-white/12 p-2 shadow-inner shadow-sky-950/20 backdrop-blur sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Email address"
              className="min-h-12 flex-1 rounded-full border border-transparent bg-white px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-cyan-200 focus:ring-2 focus:ring-cyan-100/70"
            />
            <button
              type="submit"
              className="min-h-12 rounded-full bg-slate-950 px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:bg-slate-900"
            >
              Join the current
            </button>
          </form>
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
