import "server-only";

import {
  defaultPublicShopFilterSettings,
  type PublicShopCategoryFilter,
  type PublicShopDesignFilter,
  type PublicShopFilterSettings,
} from "@/lib/filter-config";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const SHOP_FILTER_SETTINGS_COLLECTION = "siteSettings";
export const SHOP_FILTER_SETTINGS_DOCUMENT = "shopFilters";

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function booleanOrDefault(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeCategory(slug: string, input: unknown): PublicShopCategoryFilter {
  const fallback = defaultPublicShopFilterSettings.categories[slug] ?? {
    label: slug,
    isVisibleOnShop: false,
    isComingSoon: false,
  };
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    label: stringOrDefault(data.label, fallback.label),
    isVisibleOnShop: booleanOrDefault(data.isVisibleOnShop, fallback.isVisibleOnShop),
    isComingSoon: booleanOrDefault(data.isComingSoon, fallback.isComingSoon),
  };
}

function normalizeDesign(slug: string, input: unknown): PublicShopDesignFilter {
  const fallback = defaultPublicShopFilterSettings.designs[slug] ?? {
    label: slug,
    isVisibleOnShop: false,
  };
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    label: stringOrDefault(data.label, fallback.label),
    isVisibleOnShop: booleanOrDefault(data.isVisibleOnShop, fallback.isVisibleOnShop),
  };
}

export function normalizeShopFilterSettings(input: unknown): PublicShopFilterSettings {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const categories = data.categories && typeof data.categories === "object" ? (data.categories as Record<string, unknown>) : {};
  const designs = data.designs && typeof data.designs === "object" ? (data.designs as Record<string, unknown>) : {};

  const normalized: PublicShopFilterSettings = { categories: {}, designs: {} };
  Object.keys(defaultPublicShopFilterSettings.categories).forEach((slug) => {
    normalized.categories[slug] = normalizeCategory(slug, categories[slug]);
  });
  Object.keys(defaultPublicShopFilterSettings.designs).forEach((slug) => {
    normalized.designs[slug] = normalizeDesign(slug, designs[slug]);
  });

  return normalized;
}

export async function getShopFilterSettings(): Promise<PublicShopFilterSettings> {
  const db = getAdminDb();
  if (!db) return defaultPublicShopFilterSettings;

  try {
    const snapshot = await db
      .collection(SHOP_FILTER_SETTINGS_COLLECTION)
      .doc(SHOP_FILTER_SETTINGS_DOCUMENT)
      .get();
    if (!snapshot.exists) return defaultPublicShopFilterSettings;
    return normalizeShopFilterSettings(snapshot.data());
  } catch (error) {
    console.error("[shop-filter-settings] Failed to read siteSettings/shopFilters", error);
    return defaultPublicShopFilterSettings;
  }
}

export async function saveShopFilterSettings(input: unknown): Promise<PublicShopFilterSettings> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin is not configured.");

  const settings = normalizeShopFilterSettings(input);
  await db
    .collection(SHOP_FILTER_SETTINGS_COLLECTION)
    .doc(SHOP_FILTER_SETTINGS_DOCUMENT)
    .set(settings, { merge: true });
  return settings;
}
