import type { Metadata } from "next";
import { fetchStorefrontProductsPage, type StorefrontProduct, type StorefrontProductsCursor } from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import ShopClient from "./shop-client";
import { getSelectableCollections, getSelectableDesigns } from "@/lib/categories";
import { resolveLocale, type Locale } from "@/i18n/config";
import { buildAlternateLanguages, buildLocalizedUrl, defaultOgImageUrl } from "@/lib/seo";

export const revalidate = 0;

const shopMetadataByLocale: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Shop | Fish Your Style",
    description: "Browse Fish Your Style streetwear drops, colors, and fits designed for every mood.",
  },
  fr: {
    title: "Boutique | Fish Your Style",
    description: "Parcourez les collections, couleurs et coupes Fish Your Style conçues pour chaque humeur.",
  },
  ar: {
    title: "المتجر | Fish Your Style",
    description: "تسوّق تشكيلات ستريت وير Fish Your Style والألوان والقصّات المصممة لكل مزاج.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { title, description } = shopMetadataByLocale[locale];
  const url = buildLocalizedUrl(locale, "/shop");
  const ogImages = [defaultOgImageUrl];

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages("/shop"),
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
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
    gender: sp.gender ?? "", // Don't default to "unisex" - empty string means not set
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
    // attach filter fields for client filtering
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

export default async function ShopPage() {
  let storefrontProducts: StorefrontProduct[] = [];
  let errorMessage: string | null = null;
  let categories: Awaited<ReturnType<typeof getSelectableCollections>> = [];
  let designThemes: Awaited<ReturnType<typeof getSelectableDesigns>> = [];
  let nextCursor: StorefrontProductsCursor | null = null;
  try {
    const firstPage = await fetchStorefrontProductsPage({ pageSize: 24 });
    storefrontProducts = firstPage.products;
    nextCursor = firstPage.nextCursor;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    errorMessage = "Products are temporarily unavailable.";
  }

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

  const products = storefrontProducts.map(mapStorefrontToProduct);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 overscroll-y-contain">
      <ShopClient
        products={products}
        initialCursor={nextCursor}
        errorMessage={errorMessage}
        categories={categories}
        designThemes={designThemes}
      />
    </main>
  );
}
