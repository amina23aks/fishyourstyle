import { fetchAllStorefrontProducts, type StorefrontProduct } from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import ShopClient from "./shop-client";
import { fetchAllCategories } from "@/lib/categories";

export const revalidate = 3600;

function mapStorefrontToProduct(sp: StorefrontProduct): Product {
  const mainImage = sp.images?.[0] ?? "/placeholder.png";
  const gallery = sp.images?.slice(1) ?? [];
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
    stock: sp.stock ?? 0,
    inStock: sp.inStock ?? false,
  } as Product & { designTheme?: string; tags?: string[]; discountPercent?: number; stock?: number; inStock?: boolean };
}

export default async function ShopPage() {
  let storefrontProducts: StorefrontProduct[] = [];
  let errorMessage: string | null = null;
  let categories: Awaited<ReturnType<typeof fetchAllCategories>> = [];
  let designThemes: Awaited<ReturnType<typeof fetchAllCategories>> = [];
  try {
    storefrontProducts = await fetchAllStorefrontProducts();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    errorMessage = "Products are temporarily unavailable.";
  }

  try {
    categories = await fetchAllCategories("category");
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }

  try {
    designThemes = await fetchAllCategories("design");
  } catch (error) {
    console.error("Failed to fetch design themes:", error);
  }

  const products = storefrontProducts.map(mapStorefrontToProduct);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 overscroll-y-contain">
      <ShopClient products={products} errorMessage={errorMessage} categories={categories} designThemes={designThemes} />
    </main>
  );
}
