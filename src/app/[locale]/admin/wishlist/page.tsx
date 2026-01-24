import type { Metadata } from "next";

import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export type AdminWishlistEntry = {
  id: string;
  email: string;
  createdAt: string;
};

export const metadata: Metadata = {
  title: "Wishlist | Admin | Fish Your Style",
  description: "View recent wishlist signups.",
};

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

async function fetchWishlistEntries(): Promise<AdminWishlistEntry[]> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin is not configured.");
  }

  const snapshot = await db
    .collection("wishlist")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as {
      email?: string;
      createdAt?: Timestamp;
    };

    return {
      id: doc.id,
      email: data.email ?? "",
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : "",
    };
  });
}

export default async function WishlistPage() {
  let entries: AdminWishlistEntry[] = [];
  let error: string | null = null;

  try {
    entries = await fetchWishlistEntries();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load wishlist.";
    error = message;
  }

  const isEmpty = !error && entries.length === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Wishlist</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Wishlist</h1>
        <p className="max-w-3xl text-sm text-sky-100/90 sm:text-base">
          Review shoppers who saved their interest. Use these signups to nurture demand and keep them in the loop when
          new products arrive.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/50 backdrop-blur">
        <div className="border-b border-white/10 px-6 py-4 text-sm text-sky-100/80">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">
            Showing {entries.length} {entries.length === 1 ? "signup" : "signups"}
          </span>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">Failed to load wishlist</p>
            <p className="mt-2 text-sm text-sky-100/75">{error}</p>
          </div>
        ) : isEmpty ? (
          <div className="px-6 py-12 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">No wishlist signups yet.</p>
            <p className="mt-2 text-sm">
              Once shoppers save items, their emails will appear here so you can follow up with product drops and
              restocks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-sky-100/85">
              <thead className="bg-slate-950/60 backdrop-blur">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Created at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 text-white">
                      <div className="break-all font-semibold">
                        {entry.email || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sky-100/80">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
