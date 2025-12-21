import type { Metadata } from "next";

import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { FavoriteItem } from "@/types/favorites";

type FavoritesRow = {
  id: string;
  email: string;
  userId: string;
  count: number;
  updatedAt: string | Timestamp | undefined;
  items: FavoriteItem[];
};

type ProductStat = {
  productId: string;
  name: string;
  image: string;
  slug: string;
  count: number;
};

export const metadata: Metadata = {
  title: "Favorites | Admin | Fish Your Style",
  description: "Monitor user favorites and popular products.",
};

function normalizeDate(value: string | Timestamp | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const date = value.toDate();
  return date.toISOString();
}

function formatDateTime(value: string | Timestamp | undefined) {
  const iso = normalizeDate(value);
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatItemDate(value: FavoriteItem["addedAt"]) {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  }
  if (value && typeof (value as { seconds?: number }).seconds === "number") {
    const seconds = (value as { seconds: number; nanoseconds?: number }).seconds;
    return new Date(seconds * 1000).toLocaleString();
  }
  return "—";
}

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
      updatedAt?: Timestamp;
    };
    return {
      id: doc.id,
      email: data.email ?? "Guest",
      userId: doc.id,
      count: data.items?.length ?? 0,
      updatedAt: normalizeDate(data.updatedAt),
      items: data.items ?? [],
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
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sky-50 shadow-2xl shadow-sky-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Total users</p>
              <p className="mt-2 text-3xl font-semibold text-white">{rows.length}</p>
              <p className="text-sm text-sky-100/80">Users who have saved favorites</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sky-50 shadow-2xl shadow-sky-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Total favorites</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {rows.reduce((sum, row) => sum + row.count, 0)}
              </p>
              <p className="text-sm text-sky-100/80">Sum of all saved items</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/40 backdrop-blur">
            <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Users</p>
                <p className="text-sm text-sky-100/80">Favorites per user</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">
                Showing {rows.length} {rows.length === 1 ? "user" : "users"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-sky-100/85">
                <thead className="bg-slate-950/60 backdrop-blur">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">User</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">UID</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Favorites</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Updated</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4 text-white">{row.email || "Guest"}</td>
                      <td className="px-6 py-4 text-white/80 text-xs">{row.userId}</td>
                      <td className="px-6 py-4 text-white">{row.count}</td>
                      <td className="px-6 py-4 text-sky-100/80">{formatDateTime(row.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <details className="group">
                          <summary className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-white/30 hover:bg-white/10">
                            View items
                            <span className="text-sky-200 transition group-open:rotate-90">›</span>
                          </summary>
                          <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-sky-100/80">
                              <p><span className="font-semibold text-white">UID:</span> {row.userId}</p>
                              <p><span className="font-semibold text-white">Updated:</span> {formatDateTime(row.updatedAt)}</p>
                            </div>
                            {row.items.length === 0 ? (
                              <p className="text-xs text-sky-100/80">No items saved.</p>
                            ) : (
                              row.items.map((item) => (
                                <div
                                  key={item.productId}
                                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-2"
                                >
                                  {item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-12 w-12 rounded-lg object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-[10px] text-white/70">
                                      No image
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-white">{item.name}</p>
                                    <p className="text-xs text-sky-100/80">
                                      {item.price.toLocaleString("fr-DZ")} {item.currency} • {item.inStock ? "In stock" : "Out of stock"}
                                    </p>
                                    <p className="text-[11px] text-sky-100/70">Added: {formatItemDate(item.addedAt)}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/40 backdrop-blur">
            <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Most favorited</p>
                <p className="text-sm text-sky-100/80">Top products shoppers love</p>
              </div>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {topProducts.length === 0 ? (
                <p className="text-sm text-sky-100/80">No favorites data yet.</p>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-sky-50 shadow-lg shadow-sky-900/30"
                  >
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-14 w-14 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-[10px] text-white/70">
                        No image
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{product.name}</p>
                      <p className="text-xs text-sky-100/80">{product.count} favorites</p>
                    </div>
                    {index === 0 && (
                      <span className="rounded-full bg-emerald-400/90 px-3 py-1 text-[10px] font-semibold uppercase text-emerald-950">
                        Top favorite
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
