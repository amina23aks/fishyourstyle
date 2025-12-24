import type { Metadata } from "next";

import { getAdminDb } from "@/lib/firebaseAdmin";
import type { FavoriteItem } from "@/types/favorites";
import FavoritesAdminClient from "./FavoritesAdminClient";

export const metadata: Metadata = {
  title: "Favorites | Admin | Fish Your Style",
  description: "Monitor user favorites and popular products.",
};

type TimestampLike =
  | { toDate: () => Date }
  | { _seconds: number; _nanoseconds?: number }
  | { seconds: number; nanoseconds?: number };

type AdminFavoriteItem = Omit<FavoriteItem, "addedAt"> & {
  addedAt: string | null;
};

function normalizeDate(value: string | TimestampLike | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if ("toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if ("_seconds" in value && typeof value._seconds === "number") {
    return new Date(value._seconds * 1000).toISOString();
  }
  if ("seconds" in value && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }
  return null;
}

export type FavoritesRow = {
  id: string;
  email: string;
  userId: string;
  count: number;
  updatedAt: string | null;
  items: AdminFavoriteItem[];
};

export type ProductStat = {
  productId: string;
  name: string;
  image: string;
  slug: string;
  count: number;
};

async function fetchFavorites(): Promise<{ rows: FavoritesRow[]; topProducts: ProductStat[] }> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin is not configured.");
  }

  const snapshot = await db.collection("favorites").orderBy("updatedAt", "desc").get();

  const rows: FavoritesRow[] = snapshot.docs.map((doc) => {
    const data = doc.data() as {
      email?: string | null;
      items?: FavoriteItem[];
      updatedAt?: TimestampLike;
    };
    return {
      id: doc.id,
      email: data.email ?? "Guest",
      userId: doc.id,
      count: data.items?.length ?? 0,
      updatedAt: normalizeDate(data.updatedAt),
      items:
        data.items?.map((item) => ({
          ...item,
          addedAt: normalizeDate(item.addedAt as TimestampLike | string | null | undefined),
        })) ?? [],
    };
  });

  const productMap = new Map<string, ProductStat>();
  rows.forEach((row) => {
    row.items.forEach((item) => {
      const key = item.productId ?? item.id;
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

  const topProducts = Array.from(productMap.values()).sort((a, b) => b.count - a.count).slice(0, 12);

  return { rows, topProducts };
}

export default async function AdminFavoritesPage() {
  let rows: FavoritesRow[] = [];
  let topProducts: ProductStat[] = [];
  let error: string | null = null;

  try {
    const data = await fetchFavorites();
    rows = data.rows;
    topProducts = data.topProducts;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load favorites.";
    error = message;
  }

  return <FavoritesAdminClient rows={rows} topProducts={topProducts} error={error} />;
}
