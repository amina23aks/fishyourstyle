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

export type PublicShopCategoryVisibility = {
  slug: string;
  label: string;
  isVisibleOnShop: boolean;
  isComingSoon: boolean;
};

export const PUBLIC_SHOP_CATEGORY_VISIBILITY: PublicShopCategoryVisibility[] = [
  {
    slug: "tshirts",
    label: "Tshirts",
    isVisibleOnShop: true,
    isComingSoon: false,
  },
  {
    slug: "pants",
    label: "Pants",
    isVisibleOnShop: true,
    isComingSoon: true,
  },
  {
    slug: "ensembles",
    label: "Ensembles",
    isVisibleOnShop: true,
    isComingSoon: true,
  },
  {
    slug: "hoodies",
    label: "Hoodies",
    isVisibleOnShop: false,
    isComingSoon: false,
  },
  {
    slug: "sweatshirts",
    label: "Sweatshirts",
    isVisibleOnShop: false,
    isComingSoon: false,
  },
];

export const PUBLIC_SHOP_DESIGN_VISIBILITY = [
  {
    slug: "simple",
    label: "Simple",
    isVisibleOnShop: false,
  },
] as const;

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

const allCategoryVisibility = new Map(
  PUBLIC_SHOP_CATEGORY_VISIBILITY.map((category) => [
    normalizeValue(category.slug),
    category,
  ]),
);

const visibleDesignSlugs = new Set(
  PUBLIC_SHOP_DESIGN_VISIBILITY.filter((design) => design.isVisibleOnShop).map(
    (design) => normalizeValue(design.slug),
  ),
);

export function getPublicShopCategoryVisibility(
  value: string,
): PublicShopCategoryVisibility | null {
  return allCategoryVisibility.get(normalizeValue(value)) ?? null;
}

export function filterPublicCollectionPills(pills: FilterPill[]): FilterPill[] {
  return pills
    .map((pill) => {
      if (pill.value === "all") return pill;
      const visibility = getPublicShopCategoryVisibility(pill.value);
      if (!visibility?.isVisibleOnShop) return null;
      return { ...pill, label: visibility.label };
    })
    .filter((pill): pill is FilterPill => Boolean(pill))
    .sort((a, b) => {
      if (a.value === "all") return -1;
      if (b.value === "all") return 1;
      const aIndex = PUBLIC_SHOP_CATEGORY_VISIBILITY.findIndex(
        (category) => normalizeValue(category.slug) === normalizeValue(a.value),
      );
      const bIndex = PUBLIC_SHOP_CATEGORY_VISIBILITY.findIndex(
        (category) => normalizeValue(category.slug) === normalizeValue(b.value),
      );
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
}

export function filterPublicDesignPills(pills: FilterPill[]): FilterPill[] {
  return pills.filter(
    (pill) => pill.value === "all" || visibleDesignSlugs.has(normalizeValue(pill.value)),
  );
}

export function isPublicComingSoonCollection(value: string): boolean {
  return getPublicShopCategoryVisibility(value)?.isComingSoon === true;
}
