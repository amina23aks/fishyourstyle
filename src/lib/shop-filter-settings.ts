import "server-only";

import type { PublicShopFilterSettings } from "@/lib/filter-config";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSelectableCollections, getSelectableDesigns } from "@/lib/categories";
import { normalizeShopFilterSettings } from "@/lib/shop-filter-normalization";

export const SHOP_FILTER_SETTINGS_COLLECTION = "siteSettings";
export const SHOP_FILTER_SETTINGS_DOCUMENT = "shopFilters";

export async function getShopFilterSettings(): Promise<PublicShopFilterSettings> {
  const db = getAdminDb();
  const [currentCategories, currentDesigns] = await Promise.all([
    getSelectableCollections(),
    getSelectableDesigns(),
  ]);
  if (!db) return normalizeShopFilterSettings(undefined, currentCategories, currentDesigns);

  try {
    const snapshot = await db
      .collection(SHOP_FILTER_SETTINGS_COLLECTION)
      .doc(SHOP_FILTER_SETTINGS_DOCUMENT)
      .get();
    return normalizeShopFilterSettings(snapshot.data(), currentCategories, currentDesigns);
  } catch (error) {
    console.error("[shop-filter-settings] Failed to read siteSettings/shopFilters", error);
    return normalizeShopFilterSettings(undefined, currentCategories, currentDesigns);
  }
}

export async function saveShopFilterSettings(input: unknown): Promise<PublicShopFilterSettings> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin is not configured.");

  const [currentCategories, currentDesigns] = await Promise.all([
    getSelectableCollections(),
    getSelectableDesigns(),
  ]);
  const settings = normalizeShopFilterSettings(input, currentCategories, currentDesigns);
  await db
    .collection(SHOP_FILTER_SETTINGS_COLLECTION)
    .doc(SHOP_FILTER_SETTINGS_DOCUMENT)
    .set(settings, { merge: true });
  return settings;
}
