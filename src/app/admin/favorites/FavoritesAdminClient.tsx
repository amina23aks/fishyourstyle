"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { FavoritesRow, ProductStat } from "./page";

type FavoritesAdminClientProps = {
  rows: FavoritesRow[];
  topProducts: ProductStat[];
  error: string | null;
};

function formatDateTime(value: FavoritesRow["updatedAt"]) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatItemDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function FavoritesAdminClient({ rows, topProducts, error }: FavoritesAdminClientProps) {
  const [activeRow, setActiveRow] = useState<FavoritesRow | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totals = useMemo(
    () => ({
      users: rows.length,
      favorites: rows.reduce((sum, row) => sum + row.count, 0),
    }),
    [rows],
  );

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
              <p className="mt-2 text-3xl font-semibold text-white">{totals.users}</p>
              <p className="text-sm text-sky-100/80">Users who have saved favorites</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sky-50 shadow-2xl shadow-sky-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Total favorites</p>
              <p className="mt-2 text-3xl font-semibold text-white">{totals.favorites}</p>
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
                      <td className="px-6 py-4 text-xs text-white/80">{row.userId}</td>
                      <td className="px-6 py-4 text-white">{row.count}</td>
                      <td className="px-6 py-4 text-sky-100/80">{formatDateTime(row.updatedAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setActiveRow(row)}
                          className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-white/30 hover:bg-white/10"
                        >
                          View items
                          <span className="text-sky-200">›</span>
                        </button>
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
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">
                Ranked by favorite count
              </span>
            </div>
            <div className="divide-y divide-white/10 px-6">
              {topProducts.length === 0 ? (
                <p className="py-6 text-sm text-sky-100/80">No favorites data yet.</p>
              ) : (
                <ol className="divide-y divide-white/10">
                  {topProducts.map((product, index) => (
                    <li key={product.productId} className="flex flex-wrap items-center gap-4 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                        #{index + 1}
                      </div>
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
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-white">{product.name}</p>
                        <p className="text-xs text-sky-100/80">{product.count} favorites</p>
                      </div>
                      {product.slug ? (
                        <Link
                          href={`/products/${product.slug}`}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-white/40 hover:bg-white/10"
                        >
                          View product
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </>
      )}

      {mounted && activeRow
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal>
              <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950/95 p-6 text-white shadow-2xl shadow-black/40">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Favorite details</p>
                    <h3 className="text-lg font-semibold">{activeRow.email || "Guest"}</h3>
                    <p className="text-xs text-sky-100/80">UID: {activeRow.userId}</p>
                    <p className="text-xs text-sky-100/80">Updated: {formatDateTime(activeRow.updatedAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRow(null)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {activeRow.items.length === 0 ? (
                    <p className="text-sm text-sky-100/80">No items saved.</p>
                  ) : (
                    activeRow.items.map((item) => (
                      <div
                        key={item.productId ?? item.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3"
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
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
