"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "@/lib/motion";

import type { AdminWishlistEntry } from "./types";

function formatDateTime(isoString: string) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WishlistAdminClient({ entries, error }: { entries: AdminWishlistEntry[]; error: string | null }) {
  const [selected, setSelected] = useState<AdminWishlistEntry | null>(null);

  const subtitle = useMemo(() => {
    if (error) return "We could not load wishlist data right now.";
    if (!entries.length) return "No wishlist entries yet. Hearts will show up as customers start saving items.";
    return "Track wishlist activity and peek into the items shoppers are saving for later.";
  }, [entries.length, error]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Wishlist</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Wishlist insights</h1>
        <p className="max-w-3xl text-sm text-sky-100/90 sm:text-base">{subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/50 backdrop-blur">
        <div className="border-b border-white/10 px-6 py-4 text-sm text-sky-100/80">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">
            Showing {entries.length} {entries.length === 1 ? "wishlist" : "wishlists"}
          </span>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">Failed to load wishlist</p>
            <p className="mt-2 text-sm text-sky-100/75">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">No wishlist entries yet.</p>
            <p className="mt-2 text-sm">
              Encourage shoppers to tap the heart on product cards to start collecting insights here.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm text-sky-100/85">
                <thead className="bg-slate-950/60 backdrop-blur">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">User</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Items</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Last updated</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4 text-white">
                        <div className="font-semibold">{entry.email || "—"}</div>
                        <div className="text-xs text-sky-100/70">{entry.userId ?? "No UID"}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">{entry.itemsCount}</td>
                      <td className="px-6 py-4 text-sky-100/80">{formatDateTime(entry.updatedAt || entry.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(entry)}
                          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-inner shadow-sky-900/40 transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 px-4 pb-6 md:hidden">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="space-y-2 rounded-2xl border border-white/10 bg-white/10 p-4 text-sky-50 shadow-inner shadow-sky-900/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{entry.email || "—"}</p>
                      <p className="text-xs text-sky-100/70">{entry.userId ?? "No UID"}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                      {entry.itemsCount} {entry.itemsCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="text-xs text-sky-100/70">
                    Updated {formatDateTime(entry.updatedAt || entry.createdAt)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(entry)}
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-inner shadow-sky-900/40 transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl rounded-3xl border border-white/15 bg-slate-950/90 p-6 text-sky-50 shadow-2xl shadow-black/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Wishlist items</p>
                  <h2 className="text-xl font-semibold text-white">{selected.email || "Anonymous user"}</h2>
                  <p className="text-xs text-sky-100/70">UID: {selected.userId ?? "N/A"}</p>
                  <p className="text-xs text-sky-100/70">Updated {formatDateTime(selected.updatedAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-semibold text-white shadow-inner shadow-sky-900/40 transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Close
                </button>
              </div>

              {selected.items.length === 0 ? (
                <p className="mt-4 text-sm text-sky-100/75">No items saved.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {selected.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantKey ?? item.slug}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm shadow-inner shadow-sky-900/30"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{item.name}</p>
                        <div className="text-xs text-sky-100/75">
                          {item.colorName ? <span className="mr-2">Color: {item.colorName}</span> : null}
                          {item.size ? <span>Size: {item.size}</span> : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">{formatDateTime(item.addedAt)}</p>
                        <p className="text-xs text-sky-100/70">
                          {new Intl.NumberFormat("fr-DZ").format(item.price)} {item.currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
