import type { Product } from "@/types/product";

export const HOMEPAGE_PREVIEW_LIMIT = 8;
export const HOMEPAGE_CATALOG_LIMIT = 48;

export function filterHomepageProducts(
  preview: Product[],
  catalog: Product[],
  filters: { category?: string; design?: string; search?: string },
): Product[] {
  const category = (filters.category ?? "all").toLowerCase();
  const design = (filters.design ?? "all").toLowerCase();
  const term = (filters.search ?? "").trim().toLowerCase();
  const active = category !== "all" || design !== "all" || Boolean(term);
  return (active ? catalog : preview).filter((product) => {
    if (category !== "all" && product.category.toLowerCase() !== category) return false;
    if (design !== "all" && (product.designTheme ?? "simple").toLowerCase() !== design) return false;
    return !term || `${product.nameFr} ${(product.tags ?? []).join(" ")}`.toLowerCase().includes(term);
  });
}
