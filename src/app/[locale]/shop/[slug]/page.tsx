import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  fetchStorefrontProductBySlug,
  fetchSuggestedStorefrontProducts,
  type StorefrontProduct,
} from "@/lib/storefront-products";
import { ProductDetailContent } from "./product-detail-content";
import type { Product } from "@/types/product";
import { resolveLocale, type Locale } from "@/i18n/config";
import {
  buildAlternateLanguages,
  buildLocalizedUrl,
  defaultOgImageUrl,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  resolveOgImageUrl,
  siteName,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const productDescriptionByLocale: Record<Locale, (name: string) => string> = {
  en: (name) => `Discover ${name} from Fish Your Style. Premium streetwear made for everyday comfort.`,
  fr: (name) => `Découvrez ${name} chez Fish Your Style. Du streetwear premium pensé pour le confort au quotidien.`,
  ar: (name) => `اكتشف ${name} من Fish Your Style. ستريت وير فاخر مصمم للراحة اليومية.`,
};

function buildProductDescription(product: StorefrontProduct, locale: Locale): string {
  const description = product.description?.trim();
  if (description) return description;
  return productDescriptionByLocale[locale](product.name);
}

function getProductSocialImage(product: StorefrontProduct): string {
  const image = product.images?.main || product.images?.gallery?.[0];
  return image ? resolveOgImageUrl(image) : defaultOgImageUrl;
}

function buildProductJsonLd(product: StorefrontProduct, locale: Locale) {
  const url = buildLocalizedUrl(locale, `/shop/${product.slug}`);
  const description = buildProductDescription(product, locale);
  const images = [product.images?.main, ...(product.images?.gallery ?? [])]
    .filter((image): image is string => Boolean(image))
    .map(resolveOgImageUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images.length > 0 ? Array.from(new Set(images)) : [defaultOgImageUrl],
    description,
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "DZD",
      price: product.finalPrice,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);
  const storefrontProduct = await fetchStorefrontProductBySlug(slug);

  if (!storefrontProduct) {
    const url = buildLocalizedUrl(locale, `/shop/${slug}`);
    return {
      title: "Product | Fish Your Style",
      alternates: {
        canonical: url,
        languages: buildAlternateLanguages(`/shop/${slug}`),
      },
    };
  }

  const productName = storefrontProduct.name ?? "Fish Your Style";
  const title = `${productName} | Fish Your Style`;
  const description = buildProductDescription(storefrontProduct, locale);
  const url = buildLocalizedUrl(locale, `/shop/${slug}`);
  const ogImages = [getProductSocialImage(storefrontProduct)];

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages(`/shop/${slug}`),
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

function normalizeImages(images: StorefrontProduct["images"] | unknown): string[] {
  const collected: string[] = [];

  if (Array.isArray(images)) {
    collected.push(...images.map(String));
  } else if (images && typeof images === "object" && !Array.isArray(images)) {
    const imgObj = images as { main?: unknown; gallery?: unknown };
    if (typeof imgObj.main === "string") {
      collected.push(imgObj.main);
    }
    if (Array.isArray(imgObj.gallery)) {
      collected.push(...imgObj.gallery.map(String));
    }
  }

  const uniqueImages = Array.from(new Set(collected.filter(Boolean)));
  let [main, ...gallery] = uniqueImages;

  if (!main && gallery.length > 0) {
    [main, ...gallery] = gallery;
  }

  const finalMain = main || "/placeholder.png";
  const finalGallery = gallery.filter((url) => url !== finalMain);

  return [finalMain, ...finalGallery];
}

function mapStorefrontToProduct(sp: StorefrontProduct): Product {
  const normalizedImages = normalizeImages(sp.images);
  const [mainImage, ...gallery] = normalizedImages;
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
    id: sp.id ?? "unknown",
    slug: sp.slug ?? "",
    nameFr: sp.name ?? "Produit",
    nameAr: sp.name ?? "Produit",
    category: sp.category ?? "hoodies",
    kind: sp.category ?? "hoodies",
    fit: "regular",
    priceDzd: sp.finalPrice ?? sp.basePrice ?? 0,
    currency: "DZD",
    gender: sp.gender ?? "", // Don't default to "unisex" - empty string means not set
    sizes: sp.sizes ?? [],
    colors,
    sizeGuideEnabled: sp.sizeGuideEnabled ?? false,
    sizeGuideImageUrl: sp.sizeGuideImageUrl ?? null,
    sizeGuideImagePublicId: sp.sizeGuideImagePublicId ?? null,
    images: { main: mainImage, gallery },
    descriptionFr: sp.description ?? "",
    descriptionAr: sp.description ?? "",
    status: "active",
    designTheme: sp.designTheme ?? "simple",
    tags: sp.tags ?? [],
    discountPercent: sp.discountPercent ?? 0,
    stockMode: sp.stockMode,
    stockQty: sp.stockQty,
    inStock: sp.inStock ?? true,
    soldOutSizes: sp.soldOutSizes,
    soldOutColorCodes: sp.soldOutColorCodes,
  };
}

type ProductDetailPageParams = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageParams) {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);
  const storefrontProduct = await fetchStorefrontProductBySlug(slug);

  if (!storefrontProduct) {
    notFound();
  }

  const product = mapStorefrontToProduct(storefrontProduct);
  const suggestedStorefrontProducts = await fetchSuggestedStorefrontProducts({
    currentSlug: storefrontProduct.slug,
    category: storefrontProduct.category,
    designTheme: storefrontProduct.designTheme,
    limitCount: 8,
  });
  const suggestedProducts = suggestedStorefrontProducts.map(mapStorefrontToProduct);

  const productStructuredData = buildProductJsonLd(storefrontProduct, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      <ProductDetailContent product={product} suggestedProducts={suggestedProducts} />
    </>
  );
}
