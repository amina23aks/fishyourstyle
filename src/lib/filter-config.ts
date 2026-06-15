import type { FilterPill } from "@/lib/dependent-filter-options";

export const DEFAULT_COLLECTION_FILTERS = [
  { label: "Hoodies", value: "hoodies" },
  { label: "Pants", value: "pants" },
  { label: "Ensembles", value: "ensembles" },
  { label: "Tshirts", value: "tshirts" },
  { label: "Sweatshirts", value: "sweatshirts" },
] as const;

export const DEFAULT_DESIGN_FILTERS = [
  { label: "Flow", value: "flow" },
  { label: "Simple", value: "simple" },
] as const;

export type PublicShopCategoryFilter = {
  label: string;
  isVisibleOnShop: boolean;
  isComingSoon: boolean;
};

export type PublicShopDesignFilter = {
  label: string;
  isVisibleOnShop: boolean;
};

export type PublicShopFilterSettings = {
  categories: Record<string, PublicShopCategoryFilter>;
  designs: Record<string, PublicShopDesignFilter>;
};

export const defaultPublicShopFilterSettings: PublicShopFilterSettings = {
  categories: {
    tshirts: { label: "Tshirts", isVisibleOnShop: true, isComingSoon: false },
    pants: { label: "Pants", isVisibleOnShop: true, isComingSoon: true },
    ensembles: { label: "Ensembles", isVisibleOnShop: true, isComingSoon: true },
    hoodies: { label: "Hoodies", isVisibleOnShop: false, isComingSoon: false },
    sweatshirts: { label: "Sweatshirts", isVisibleOnShop: false, isComingSoon: false },
  },
  designs: {
    flow: { label: "Flow", isVisibleOnShop: true },
    simple: { label: "Simple", isVisibleOnShop: false },
  },
};

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function configuredCategoryEntries(settings: PublicShopFilterSettings) {
  return Object.entries(settings.categories);
}

export function getPublicShopCategoryVisibility(
  value: string,
  settings: PublicShopFilterSettings = defaultPublicShopFilterSettings,
): PublicShopCategoryFilter | null {
  return settings.categories[normalizeValue(value)] ?? null;
}

export function filterPublicCollectionPills(
  pills: FilterPill[],
  settings: PublicShopFilterSettings = defaultPublicShopFilterSettings,
): FilterPill[] {
  return pills
    .map((pill) => {
      if (pill.value === "all") return pill;
      const visibility = getPublicShopCategoryVisibility(pill.value, settings);
      if (!visibility?.isVisibleOnShop) return null;
      return { ...pill, label: visibility.label };
    })
    .filter((pill): pill is FilterPill => Boolean(pill))
    .sort((a, b) => {
      if (a.value === "all") return -1;
      if (b.value === "all") return 1;
      const entries = configuredCategoryEntries(settings);
      const aIndex = entries.findIndex(([slug]) => normalizeValue(slug) === normalizeValue(a.value));
      const bIndex = entries.findIndex(([slug]) => normalizeValue(slug) === normalizeValue(b.value));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
}

export function filterPublicDesignPills(
  pills: FilterPill[],
  settings: PublicShopFilterSettings = defaultPublicShopFilterSettings,
): FilterPill[] {
  return pills
    .map((pill) => {
      if (pill.value === "all") return pill;
      const visibility = settings.designs[normalizeValue(pill.value)];
      if (!visibility?.isVisibleOnShop) return null;
      return { ...pill, label: visibility.label };
    })
    .filter((pill): pill is FilterPill => Boolean(pill));
}

export function isPublicComingSoonCollection(
  value: string,
  settings: PublicShopFilterSettings = defaultPublicShopFilterSettings,
): boolean {
  return getPublicShopCategoryVisibility(value, settings)?.isComingSoon === true;
}
