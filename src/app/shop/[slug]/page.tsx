import { notFound } from "next/navigation";

import { fetchStorefrontProductBySlug, type StorefrontProduct } from "@/lib/storefront-products";
import { ProductDetailContent } from "./product-detail-content";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

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
    images: { main: mainImage, gallery },
    descriptionFr: sp.description ?? "",
    descriptionAr: sp.description ?? "",
    status: "active",
    designTheme: sp.designTheme ?? "simple",
    tags: sp.tags ?? [],
    discountPercent: sp.discountPercent ?? 0,
  };
}

type ProductDetailPageParams = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageParams) {
  const { slug } = await params;
  const storefrontProduct = await fetchStorefrontProductBySlug(slug);

  if (!storefrontProduct) {
    notFound();
  }

  const product = mapStorefrontToProduct(storefrontProduct);

  return <ProductDetailContent product={product} />;
}
