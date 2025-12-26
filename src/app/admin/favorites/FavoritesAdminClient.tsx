"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FavoriteProductStat, FavoritesAdminRow } from "@/types/favorites";

function formatDateTime(value: string | null | undefined) {
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

export function FavoritesAdminClient({
  rows,
  topProducts,
}: {
  rows: FavoritesAdminRow[];
  topProducts: FavoriteProductStat[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handleOpenModal = (rowId: string) => {
    setSelectedId(rowId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
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

      <div className="space-y-6">
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
                  <tr
                    key={row.id}
                    className="cursor-pointer transition hover:bg-white/5"
                    onClick={() => handleOpenModal(row.id)}
                  >
                    <td className="px-6 py-4 text-white">{row.email || "Guest"}</td>
                    <td className="px-6 py-4 text-white/80 text-xs">{row.userId}</td>
                    <td className="px-6 py-4 text-white">{row.count}</td>
                    <td className="px-6 py-4 text-sky-100/80">{formatDateTime(row.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenModal(row.id);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-white/30 hover:bg-white/10"
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
        <div className="flex flex-col gap-4 p-6">
          {topProducts.length === 0 ? (
            <p className="text-sm text-sky-100/80">No favorites data yet.</p>
          ) : (
            topProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-sky-50 shadow-lg shadow-sky-900/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                    #{index + 1}
                  </span>
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
                  <div>
                    <p className="text-sm font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-sky-100/80">{product.count} favorites</p>
                  </div>
                </div>
                <Link
                  href={`/shop/${product.slug}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  View product
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={handleCloseModal}
            aria-label="Close favorite details"
          />
          <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 p-6 text-sky-50 shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Favorite details</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedRow.email || "Guest"}</p>
                <p className="mt-1 text-xs text-sky-100/80">UID: {selectedRow.userId}</p>
                <p className="mt-1 text-xs text-sky-100/70">
                  Updated: {formatDateTime(selectedRow.updatedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {selectedRow.items.length === 0 ? (
                <p className="text-sm text-sky-100/80">No items saved.</p>
              ) : (
                selectedRow.items.map((item) => (
                  <div
                    key={item.productId ?? item.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-3"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-[10px] text-white/70">
                        No image
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-sky-100/80">
                        {item.price.toLocaleString("fr-DZ")} {item.currency} •{" "}
                        {item.inStock ? "In stock" : "Out of stock"}
                      </p>
                      <p className="text-[11px] text-sky-100/70">Added: {formatItemDate(item.addedAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
