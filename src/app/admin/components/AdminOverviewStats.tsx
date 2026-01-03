"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

import { getDb } from "@/lib/firebaseClient";

const SUMMARY_DOC_PATH = ["adminStats", "summary"] as const;

type AdminSummary = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  updatedAt?: Timestamp | Date | string | null;
};

function toDateSafe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object" && "toDate" in (value as { toDate?: () => Date })) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function AdminOverviewStats() {
  const [summary, setSummary] = useState<AdminSummary>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    ordersToday: 0,
    ordersThisWeek: 0,
    updatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);

      const db = getDb();
      if (!db) {
        setError("Firebase is not configured. Please check environment variables.");
        setLoading(false);
        return;
      }

      try {
        const summaryRef = doc(db, ...SUMMARY_DOC_PATH);
        const snapshot = await getDoc(summaryRef);
        const data = snapshot.data() ?? {};
        setSummary({
          totalOrders: Number(data.totalOrders ?? 0),
          totalRevenue: Number(data.totalRevenue ?? 0),
          pendingOrders: Number(data.pendingOrders ?? 0),
          ordersToday: Number(data.ordersToday ?? 0),
          ordersThisWeek: Number(data.ordersThisWeek ?? 0),
          updatedAt: data.updatedAt ?? null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load admin stats";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    const date = toDateSafe(summary.updatedAt);
    if (!date) return "Not yet updated";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [summary.updatedAt]);

  const cards = useMemo(
    () => [
      {
        title: "Total orders",
        value: formatCount(summary.totalOrders),
        description: "All orders placed to date.",
      },
      {
        title: "Total revenue",
        value: formatCurrency(summary.totalRevenue),
        description: "Total gross sales across all orders.",
      },
      {
        title: "Orders today",
        value: formatCount(summary.ordersToday),
        description: "Orders placed since midnight.",
      },
      {
        title: "Orders this week",
        value: formatCount(summary.ordersThisWeek),
        description: "Orders placed during the current week.",
      },
      {
        title: "Pending orders",
        value: formatCount(summary.pendingOrders),
        description: "Orders still awaiting fulfilment.",
      },
    ],
    [
      summary.ordersThisWeek,
      summary.ordersToday,
      summary.pendingOrders,
      summary.totalOrders,
      summary.totalRevenue,
    ]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-sky-100/80">
        <span>Snapshot of orders and revenue for your store.</span>
        <span className="text-xs text-sky-100/70">Last updated: {lastUpdatedLabel}</span>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-sky-100/80">
          Loading admin stats…
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-sky-900/30"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-200">{card.title}</p>
              <p className="text-2xl font-semibold text-white">{card.value}</p>
            </div>
            <p className="mt-3 text-sm text-sky-100/80">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
