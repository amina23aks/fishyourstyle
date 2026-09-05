import {
  defaultPublicShopFilterSettings,
  type PublicShopCategoryFilter,
  type PublicShopDesignFilter,
  type PublicShopFilterSettings,
} from "@/lib/filter-config";
import type { SelectableItem } from "@/lib/categories-shared";

const stringOr = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const booleanOr = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

function categorySetting(slug: string, input: unknown, label?: string): PublicShopCategoryFilter {
  const fallback = defaultPublicShopFilterSettings.categories[slug] ?? {
    label: label ?? slug,
    isVisibleOnShop: true,
    isComingSoon: false,
  };
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    label: stringOr(data.label, fallback.label),
    isVisibleOnShop: booleanOr(data.isVisibleOnShop, fallback.isVisibleOnShop),
    isComingSoon: booleanOr(data.isComingSoon, fallback.isComingSoon),
  };
}

function designSetting(slug: string, input: unknown): PublicShopDesignFilter {
  const fallback = defaultPublicShopFilterSettings.designs[slug] ?? {
    label: slug,
    isVisibleOnShop: false,
    isComingSoon: false,
  };
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    label: stringOr(data.label, fallback.label),
    isVisibleOnShop: booleanOr(data.isVisibleOnShop, fallback.isVisibleOnShop),
    isComingSoon: booleanOr(data.isComingSoon, fallback.isComingSoon),
  };
}

export function normalizeShopFilterSettings(
  input: unknown,
  currentCategories: SelectableItem[] = [],
  currentDesigns: SelectableItem[] = [],
): PublicShopFilterSettings {
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const savedCategories = data.categories && typeof data.categories === "object" ? data.categories as Record<string, unknown> : {};
  const savedDesigns = data.designs && typeof data.designs === "object" ? data.designs as Record<string, unknown> : {};
  const normalized: PublicShopFilterSettings = { categories: {}, designs: {} };

  currentCategories.forEach(({ slug: rawSlug, label }) => {
    const slug = rawSlug.trim().toLowerCase();
    if (slug) normalized.categories[slug] = categorySetting(slug, savedCategories[slug], label);
  });
  Object.keys(savedCategories).forEach((rawSlug) => {
    const slug = rawSlug.trim().toLowerCase();
    if (slug && !normalized.categories[slug]) normalized.categories[slug] = categorySetting(slug, savedCategories[rawSlug]);
  });
  if (!Object.keys(normalized.categories).length) {
    Object.keys(defaultPublicShopFilterSettings.categories).forEach((slug) => {
      normalized.categories[slug] = categorySetting(slug, savedCategories[slug]);
    });
  }

  currentDesigns.forEach(({ slug: rawSlug }) => {
    const slug = rawSlug.trim().toLowerCase();
    if (slug) normalized.designs[slug] = designSetting(slug, savedDesigns[slug]);
  });
  Object.keys(savedDesigns).forEach((rawSlug) => {
    const slug = rawSlug.trim().toLowerCase();
    if (slug && !normalized.designs[slug]) normalized.designs[slug] = designSetting(slug, savedDesigns[rawSlug]);
  });
  if (!Object.keys(normalized.designs).length) {
    Object.keys(defaultPublicShopFilterSettings.designs).forEach((slug) => {
      normalized.designs[slug] = designSetting(slug, savedDesigns[slug]);
    });
  }
  return normalized;
}
