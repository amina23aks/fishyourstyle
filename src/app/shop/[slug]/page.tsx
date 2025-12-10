import { notFound } from "next/navigation";

import { fetchAllStorefrontProducts, fetchStorefrontProductBySlug } from "@/lib/storefront-products";
import { ProductDetailContent } from "./product-detail-content";
import type { Product } from "@/types/product";

export const revalidate = 3600;

function mapStorefrontToProduct(sp: Awaited<ReturnType<typeof fetchStorefrontProductBySlug>>): Product {
  const mainImage = sp?.images?.[0] ?? "/placeholder.png";
  const gallery = sp?.images?.slice(1) ?? [];
  return {
    id: sp?.id ?? "unknown",
    slug: sp?.slug ?? "",
    nameFr: sp?.name ?? "Produit",
    nameAr: sp?.name ?? "Produit",
    category: (sp?.category as any) ?? "hoodies",
    kind: sp?.category ?? "hoodies",
    fit: "regular",
    priceDzd: sp?.finalPrice ?? sp?.basePrice ?? 0,
    currency: "DZD",
    gender: sp?.gender ?? "", // Don't default to "unisex" - empty string means not set
    sizes: sp?.sizes ?? [],
    colors: (sp?.colors ?? []).map((hex) => ({
      id: hex,
      labelFr: hex,
      labelAr: hex,
      image: mainImage,
    })),
    images: { main: mainImage, gallery },
    descriptionFr: sp?.description ?? "",
    descriptionAr: sp?.description ?? "",
    status: "active",
    designTheme: sp?.designTheme ?? "basic",
    tags: sp?.tags ?? [],
    discountPercent: sp?.discountPercent ?? 0,
  } as Product & { designTheme?: string; tags?: string[]; discountPercent?: number };
}

export async function generateStaticParams() {
  const all = await fetchAllStorefrontProducts();
  return all.map((product) => ({ slug: product.slug }));
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
