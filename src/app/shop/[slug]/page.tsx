import { notFound } from "next/navigation";

import { fetchStorefrontProductBySlug, type StorefrontProduct } from "@/lib/storefront-products";
import { ProductDetailContent } from "./product-detail-content";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

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
