import { fetchAllStorefrontProducts, type StorefrontProduct } from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import ShopClient from "./shop-client";
import { getSelectableCollections, getSelectableDesigns } from "@/lib/categories";

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
    gender: sp.gender ?? "", // Don't default to "unisex" - empty string means not set
    sizes: sp.sizes ?? [],
    colors,
    soldOutSizes: sp.soldOutSizes,
    soldOutColorCodes: sp.soldOutColorCodes,
    images: { main: mainImage, gallery },
    descriptionFr: sp.description ?? "",
    descriptionAr: sp.description ?? "",
    status: "active",
    // attach filter fields for client filtering
    designTheme: sp.designTheme || "simple",
    tags: sp.tags ?? [],
    discountPercent: sp.discountPercent ?? 0,
    stock: sp.stock ?? 0,
    inStock: sp.inStock ?? false,
  } as Product & { designTheme?: string; tags?: string[]; discountPercent?: number; stock?: number; inStock?: boolean };
}

export default async function ShopPage() {
  let storefrontProducts: StorefrontProduct[] = [];
  let errorMessage: string | null = null;
  let categories: Awaited<ReturnType<typeof getSelectableCollections>> = [];
  let designThemes: Awaited<ReturnType<typeof getSelectableDesigns>> = [];
  try {
    storefrontProducts = await fetchAllStorefrontProducts();
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
      <ShopClient products={products} errorMessage={errorMessage} categories={categories} designThemes={designThemes} />
    </main>
  );
}
