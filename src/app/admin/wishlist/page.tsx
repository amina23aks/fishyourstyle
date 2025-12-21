import type { Metadata } from "next";
import type { Timestamp } from "firebase-admin/firestore";

import { getAdminResources } from "@/lib/firebaseAdmin";
import type { WishlistItem } from "@/types/wishlist";
import { WishlistAdminClient } from "./WishlistAdminClient";
import type { AdminWishlistEntry } from "./types";

export const metadata: Metadata = {
  title: "Wishlist | Admin | Fish Your Style",
  description: "View wishlist activity and items saved by customers.",
};

function timestampToISO(timestamp: unknown): string {
  if (!timestamp) return "";
  if (typeof timestamp === "string") return timestamp;
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  if (
    typeof timestamp === "object" &&
    ("_seconds" in timestamp || "seconds" in timestamp) &&
    ("_nanoseconds" in timestamp || "nanoseconds" in timestamp)
  ) {
    const seconds =
      (timestamp as { _seconds?: number; seconds?: number })._seconds ??
      (timestamp as { _seconds?: number; seconds?: number }).seconds ??
      0;
    const nanos =
      (timestamp as { _nanoseconds?: number; nanoseconds?: number })._nanoseconds ??
      (timestamp as { _nanoseconds?: number; nanoseconds?: number }).nanoseconds ??
      0;
    const date = new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  return "";
}

function normalizeWishlistItems(rawItems: unknown[]): WishlistItem[] {
  return (rawItems ?? [])
    .filter(Boolean)
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      productId: typeof item.productId === "string" ? item.productId : "",
      slug: typeof item.slug === "string" ? item.slug : "",
      name: typeof item.name === "string" ? item.name : "",
      image: typeof item.image === "string" ? item.image : "",
      price: typeof item.price === "number" ? item.price : Number(item.price ?? 0),
      currency: typeof item.currency === "string" ? item.currency : "DZD",
      colorName: typeof item.colorName === "string" ? item.colorName : undefined,
      colorCode: typeof item.colorCode === "string" ? item.colorCode : undefined,
      size: typeof item.size === "string" ? item.size : undefined,
      variantKey: typeof item.variantKey === "string" ? item.variantKey : undefined,
      addedAt: timestampToISO(item.addedAt),
    }))
    .filter((item) => item.productId && item.slug && item.name);
}

async function fetchWishlistEntries(): Promise<AdminWishlistEntry[]> {
  const adminResources = getAdminResources();
  if (!adminResources) {
    console.warn("[admin/wishlist] Firebase Admin not configured.");
    return [];
  }

  const { db } = adminResources;
  const snapshot = await db.collection("wishlist").orderBy("updatedAt", "desc").limit(200).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as {
      userId?: string | null;
      email?: string;
      createdAt?: Timestamp | string;
      updatedAt?: Timestamp | string;
      items?: unknown[];
    };

    const items = normalizeWishlistItems(Array.isArray(data.items) ? data.items : []);
    return {
      id: doc.id,
      userId: typeof data.userId === "string" ? data.userId : doc.id ?? null,
      email: data.email ?? "",
      createdAt: timestampToISO(data.createdAt),
      updatedAt: timestampToISO(data.updatedAt),
      itemsCount: items.length,
      items,
    };
  });
}

export default async function WishlistPage() {
  let entries: AdminWishlistEntry[] = [];
  let error: string | null = null;

  try {
    entries = await fetchWishlistEntries();
  } catch (err) {
    console.error("[admin/wishlist] Failed to load wishlist entries", err);
    error = err instanceof Error ? err.message : "Failed to load wishlist entries.";
  }

  return <WishlistAdminClient entries={entries} error={error} />;
}
