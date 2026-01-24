import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import { fetchAllStorefrontProducts, type StorefrontProduct } from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import HomeClient from "./home-client";
import { getSelectableCollections, getSelectableDesigns } from "@/lib/categories";
import { localizePathname } from "@/i18n/paths";
import { resolveLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { createTranslator } from "@/i18n/translator";

export const revalidate = 0;

function mapStorefrontToProduct(sp: StorefrontProduct): Product {
  const mainImage = sp.images?.main || "/placeholder.png";
  const gallery = sp.images?.gallery ?? [];
  const colors = (sp.colors ?? []).map((color) => {
    if (typeof color === "string") {
      return { id: color, labelFr: color, labelAr: color, image: mainImage };
    }
    const id = typeof color.id === "string" && color.id ? color.id : mainImage;
    const labelFr = typeof color.labelFr === "string" && color.labelFr ? color.labelFr : id;
    const labelAr = typeof color.labelAr === "string" && color.labelAr ? color.labelAr : labelFr;
    const image = typeof color.image === "string" && color.image ? color.image : mainImage;
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

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const messages = await getMessages(locale);
  const t = createTranslator(messages);
  let errorMessage: string | null = null;
  let categories: Awaited<ReturnType<typeof getSelectableCollections>> = [];
  let designThemes: Awaited<ReturnType<typeof getSelectableDesigns>> = [];
  const storefrontProducts = await fetchAllStorefrontProducts().catch((error) => {
    console.error("Failed to fetch products:", error);
    errorMessage = "Products are temporarily unavailable.";
    return [];
  });
  try {
    categories = await getSelectableCollections();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    categories = [];
  }
  try {
    designThemes = await getSelectableDesigns();
  } catch (error) {
    console.error("Failed to fetch design themes:", error);
    designThemes = [];
  }
  const allProducts = storefrontProducts.map(mapStorefrontToProduct);
  const products = allProducts.slice(0, 8);
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
      <Hero />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-12 sm:px-6 lg:px-8">
        <section className="space-y-4" id="shop-search">
          <div className="flex flex-col gap-2 md:max-w-2xl">
            <p className="text-sm uppercase tracking-[0.28em] text-white/90">{t("shop.headerEyebrow")}</p>
            <h2 className="text-2xl font-semibold text-white">{t("shop.headerTitle")}</h2>
            <p className="text-white/80">
              {t("shop.headerDescriptionLine1")}
              <br />
              {t("shop.headerDescriptionLine2")}
            </p>
          </div>

          <HomeClient products={products} categories={categories} designThemes={designThemes} />
          {errorMessage ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex w-full justify-center pt-2">
            <Link
              href={localizePathname(locale, "/shop")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200/50 transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {t("shop.exploreMoreCta")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="space-y-8 rounded-3xl bg-sky-900/90 px-6 py-14 text-sky-50 shadow-lg shadow-sky-200/60 md:px-10">
          <div className="flex flex-col gap-3">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200">{t("whyUs.eyebrow")}</p>
            <h2 className="text-2xl font-semibold">{t("whyUs.title")}</h2>
            <p className="text-sky-100">
              {t("whyUs.subtitle")}
            </p>
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
                    className="object-contain"
                  />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {reason.title}
                </h3>
                <p className="mt-3 text-sm text-sky-100/90">{reason.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
