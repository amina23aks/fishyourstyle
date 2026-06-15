import type { FilterPill } from "@/lib/dependent-filter-options";

export const DEFAULT_COLLECTION_FILTERS = [
  { label: "Hoodies", value: "hoodies" },
  { label: "Pants", value: "pants" },
  { label: "Ensembles", value: "ensembles" },
  { label: "Tshirts", value: "tshirts" },
  { label: "Sweatshirts", value: "sweatshirts" },
] as const;

export const DEFAULT_DESIGN_FILTERS = [
  { label: "Simple", value: "simple" },
] as const;

export const PUBLIC_SHOP_FILTER_CONFIG = {
  collections: {
    visible: ["tshirts", "pants", "ensembles"],
    comingSoonWhenEmpty: ["pants", "ensembles"],
    hidden: ["hoodies", "sweatshirts"],
  },
  designs: {
    visible: [],
    hidden: ["simple"],
  },
} as const;

export type PublicShopFilterConfig = typeof PUBLIC_SHOP_FILTER_CONFIG;

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function getAllowedValues(values: readonly string[]): Set<string> {
  return new Set(values.map(normalizeValue));
}

function sortByConfiguredOrder(pills: FilterPill[], values: readonly string[]): FilterPill[] {
  const order = new Map(values.map((value, index) => [normalizeValue(value), index]));
  return [...pills].sort((a, b) => {
    if (a.value === "all") return -1;
    if (b.value === "all") return 1;
    return (order.get(normalizeValue(a.value)) ?? 999) - (order.get(normalizeValue(b.value)) ?? 999);
  });
}

export function filterPublicCollectionPills(pills: FilterPill[]): FilterPill[] {
  const visibleCollections = getAllowedValues(PUBLIC_SHOP_FILTER_CONFIG.collections.visible);
  return sortByConfiguredOrder(
    pills.filter((pill) => pill.value === "all" || visibleCollections.has(normalizeValue(pill.value))),
    PUBLIC_SHOP_FILTER_CONFIG.collections.visible,
  );
}

export function filterPublicDesignPills(pills: FilterPill[]): FilterPill[] {
  const visibleDesigns = getAllowedValues(PUBLIC_SHOP_FILTER_CONFIG.designs.visible);
  return sortByConfiguredOrder(
    pills.filter((pill) => pill.value === "all" || visibleDesigns.has(normalizeValue(pill.value))),
    PUBLIC_SHOP_FILTER_CONFIG.designs.visible,
  );
}

export function isPublicComingSoonCollection(value: string): boolean {
  return getAllowedValues(PUBLIC_SHOP_FILTER_CONFIG.collections.comingSoonWhenEmpty).has(normalizeValue(value));
}
