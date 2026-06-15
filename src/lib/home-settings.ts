import "server-only";

import { getAdminDb } from "@/lib/firebaseAdmin";
import type { FeaturedDropConfig } from "@/components/FeaturedDropSection";

export type HomeSettings = {
  showFeaturedDrop: boolean;
  showHomeShopSection: boolean;
  featuredDropSlug: "flow";
  featuredDrop: FeaturedDropConfig;
};

export const HOME_SETTINGS_COLLECTION = "siteSettings";
export const HOME_SETTINGS_DOCUMENT = "home";

export const defaultHomeSettings: HomeSettings = {
  showFeaturedDrop: true,
  showHomeShopSection: false,
  featuredDropSlug: "flow",
  featuredDrop: {
    title: "FLOW — DROP 01",
    label: "Find Your Flow.",
    subtitle:
      "The first chapter of Fish Your Style. A collection inspired by finding your own rhythm.",
    buttonText: "Discover FLOW",
    buttonLink: "#flow-drop",
    maxProducts: 4,
    active: true,
  },
};

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function booleanOrDefault(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function maxProductsOrDefault(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(24, Math.floor(parsed)));
}

export function normalizeHomeSettings(input: unknown): HomeSettings {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const featuredDrop =
    data.featuredDrop && typeof data.featuredDrop === "object"
      ? (data.featuredDrop as Record<string, unknown>)
      : {};

  const showFeaturedDrop = booleanOrDefault(
    data.showFeaturedDrop,
    defaultHomeSettings.showFeaturedDrop,
  );

  return {
    showFeaturedDrop,
    showHomeShopSection: booleanOrDefault(
      data.showHomeShopSection,
      defaultHomeSettings.showHomeShopSection,
    ),
    featuredDropSlug: "flow",
    featuredDrop: {
      title: stringOrDefault(
        featuredDrop.title,
        defaultHomeSettings.featuredDrop.title,
      ),
      label: stringOrDefault(
        featuredDrop.label,
        defaultHomeSettings.featuredDrop.label,
      ),
      subtitle: stringOrDefault(
        featuredDrop.subtitle,
        defaultHomeSettings.featuredDrop.subtitle,
      ),
      buttonText: stringOrDefault(
        featuredDrop.buttonText,
        defaultHomeSettings.featuredDrop.buttonText,
      ),
      buttonLink: stringOrDefault(
        featuredDrop.buttonLink,
        defaultHomeSettings.featuredDrop.buttonLink,
      ),
      maxProducts: maxProductsOrDefault(
        featuredDrop.maxProducts,
        defaultHomeSettings.featuredDrop.maxProducts,
      ),
      active: showFeaturedDrop,
    },
  };
}

export async function getHomeSettings(): Promise<HomeSettings> {
  const db = getAdminDb();
  if (!db) return defaultHomeSettings;

  try {
    const snapshot = await db
      .collection(HOME_SETTINGS_COLLECTION)
      .doc(HOME_SETTINGS_DOCUMENT)
      .get();

    if (!snapshot.exists) return defaultHomeSettings;
    return normalizeHomeSettings(snapshot.data());
  } catch (error) {
    console.error("[home-settings] Failed to read siteSettings/home", error);
    return defaultHomeSettings;
  }
}

export async function saveHomeSettings(input: unknown): Promise<HomeSettings> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin is not configured.");
  }

  const settings = normalizeHomeSettings(input);
  await db
    .collection(HOME_SETTINGS_COLLECTION)
    .doc(HOME_SETTINGS_DOCUMENT)
    .set(settings, { merge: true });

  return settings;
}
