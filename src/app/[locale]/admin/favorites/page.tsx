import type { Metadata } from "next";

import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type {
  FavoriteItem,
  FavoriteItemClient,
  FavoriteProductStat,
  FavoritesAdminRow,
} from "@/types/favorites";
import { FavoritesAdminClient } from "./FavoritesAdminClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Favorites | Admin | Fish Your Style",
  description: "Monitor user favorites and popular products.",
};

function normalizeDate(value: string | Timestamp | undefined | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  const date = value.toDate();
  return date.toISOString();
}

function normalizeItemDate(value: FavoriteItem["addedAt"]): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof (value as { seconds?: number }).seconds === "number") {
    const seconds = (value as { seconds: number; nanoseconds?: number }).seconds;
    return new Date(seconds * 1000).toISOString();
  }
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return null;
}

async function fetchFavorites(): Promise<{
  rows: FavoritesAdminRow[];
  topProducts: FavoriteProductStat[];
}> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin is not configured.");
  }

  const snapshot = await db.collection("favorites").orderBy("updatedAt", "desc").get();

  const rows: FavoritesAdminRow[] = snapshot.docs
    .map((doc) => {
    const data = doc.data() as {
      email?: string | null;
      items?: FavoriteItem[];
      updatedAt?: Timestamp;
    };
    const items: FavoriteItemClient[] = (data.items ?? [])
      .map((item) => ({
        ...item,
        addedAt: normalizeItemDate(item.addedAt),
      }))
      .sort((a, b) => {
        const aTime = a.addedAt ? Date.parse(a.addedAt) : 0;
        const bTime = b.addedAt ? Date.parse(b.addedAt) : 0;
        return bTime - aTime;
      });
    return {
      id: doc.id,
      email: data.email ?? "Guest",
      userId: doc.id,
      count: items.length,
      updatedAt: normalizeDate(data.updatedAt),
      items,
    };
    })
    .filter((row) => row.items.length > 0);

  const productMap = new Map<string, FavoriteProductStat>();
  rows.forEach((row) => {
    const uniqueProductIds = new Set<string>();
    row.items.forEach((item) => {
      const key = item.productId ?? item.id;
      if (!key || uniqueProductIds.has(key)) return;
      uniqueProductIds.add(key);
      const existing = key ? productMap.get(key) : undefined;
      if (existing) {
        existing.count += 1;
        return;
      }
      if (key) {
        productMap.set(key, {
          productId: key,
          name: item.name,
          image: item.image,
          slug: item.slug,
          count: 1,
        });
      }
    });
  });

  const topProducts = Array.from(productMap.values()).sort((a, b) => b.count - a.count);

  return { rows, topProducts };
}

export default async function AdminFavoritesPage() {
  let rows: FavoritesAdminRow[] = [];
  let topProducts: FavoriteProductStat[] = [];
  let error: string | null = null;

  try {
    const data = await fetchFavorites();
    rows = data.rows;
    topProducts = data.topProducts;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load favorites.";
    error = message;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Favorites</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Favorites</h1>
        <p className="max-w-3xl text-sm text-sky-100/90 sm:text-base">
          Track what shoppers love and identify top-performing products.
        </p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center text-sky-50 shadow-2xl shadow-sky-900/40">
          <p className="text-lg font-semibold text-white">Failed to load favorites</p>
          <p className="mt-2 text-sm text-sky-100/75">{error}</p>
        </div>
      ) : (
        <FavoritesAdminClient rows={rows} topProducts={topProducts} />
      )}
    </div>
  );
}
