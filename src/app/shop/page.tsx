import { motion } from "@/lib/motion";
import { fetchAllStorefrontProducts, type StorefrontProduct } from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import ShopClient from "./shop-client";

export const revalidate = 3600;

function mapStorefrontToProduct(sp: StorefrontProduct): Product {
  const mainImage = sp.images?.[0] ?? "/placeholder.png";
  const gallery = sp.images?.slice(1) ?? [];
  return {
    id: sp.id,
    slug: sp.slug,
    nameFr: sp.name,
    nameAr: sp.name,
    category: sp.category as any,
    kind: sp.category,
    fit: "regular",
    priceDzd: sp.finalPrice ?? sp.basePrice,
    currency: "DZD",
    gender: sp.gender ?? "unisex",
    sizes: sp.sizes ?? [],
    colors: (sp.colors ?? []).map((hex) => ({
      id: hex,
      labelFr: hex,
      labelAr: hex,
      image: mainImage,
    })),
    images: { main: mainImage, gallery },
    descriptionFr: sp.description ?? "",
    descriptionAr: sp.description ?? "",
    status: "active",
    // attach filter fields for client filtering
    designTheme: sp.designTheme,
    tags: sp.tags ?? [],
    discountPercent: sp.discountPercent ?? 0,
  } as Product & { designTheme?: string; tags?: string[]; discountPercent?: number };
}

export default async function ShopPage() {
  const storefrontProducts = await fetchAllStorefrontProducts();
  const products = storefrontProducts.map(mapStorefrontToProduct);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 overscroll-y-contain">
      <ShopClient products={products} />
    </main>
  );
}
