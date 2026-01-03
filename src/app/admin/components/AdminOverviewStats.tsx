"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, documentId, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

import { getDb } from "@/lib/firebaseClient";

const SUMMARY_DOC_PATH = ["adminStats", "summary"] as const;
const DAILY_COLLECTION = "adminStatsDaily";

type AdminSummary = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  updatedAt?: Timestamp | Date | string | null;
};

type DailyStat = {
  dateKey: string;
  orders: number;
  revenue: number;
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
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [trendMetric, setTrendMetric] = useState<"orders" | "revenue">("orders");

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      setDailyLoading(true);
      setDailyError(null);

      const db = getDb();
      if (!db) {
        setError("Firebase is not configured. Please check environment variables.");
        setLoading(false);
        setDailyError("Firebase is not configured. Please check environment variables.");
        setDailyLoading(false);
        return;
      }

      try {
        const summaryRef = doc(db, ...SUMMARY_DOC_PATH);
        const dailyQuery = query(
          collection(db, DAILY_COLLECTION),
          orderBy(documentId(), "desc"),
          limit(7)
        );
        const [summarySnapshot, dailySnapshot] = await Promise.all([
          getDoc(summaryRef),
          getDocs(dailyQuery),
        ]);
        const data = summarySnapshot.data() ?? {};
        setSummary({
          totalOrders: Number(data.totalOrders ?? 0),
          totalRevenue: Number(data.totalRevenue ?? 0),
          pendingOrders: Number(data.pendingOrders ?? 0),
          ordersToday: Number(data.ordersToday ?? 0),
          ordersThisWeek: Number(data.ordersThisWeek ?? 0),
          updatedAt: data.updatedAt ?? null,
        });
        const daily = dailySnapshot.docs
          .map((docSnap) => {
            const dailyData = docSnap.data() ?? {};
            return {
              dateKey: docSnap.id,
              orders: Number(dailyData.orders ?? 0),
              revenue: Number(dailyData.revenue ?? 0),
            };
          })
          .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        setDailyStats(daily);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load admin stats";
        setError(message);
        setDailyError(message);
      } finally {
        setLoading(false);
        setDailyLoading(false);
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

  const trendSeries = useMemo(() => {
    return dailyStats.map((stat) => ({
      label: stat.dateKey.slice(5),
      value: trendMetric === "orders" ? stat.orders : stat.revenue,
    }));
  }, [dailyStats, trendMetric]);

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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Trends (Last 7 days)</p>
            <h3 className="text-lg font-semibold text-white">Weekly snapshot</h3>
          </div>
          <div className="flex gap-2 rounded-full bg-white/5 p-1 text-xs font-semibold text-sky-100">
            {(["orders", "revenue"] as const).map((metric) => (
              <button
                key={metric}
                type="button"
                onClick={() => setTrendMetric(metric)}
                className={`rounded-full px-3 py-1 transition ${
                  trendMetric === metric
                    ? "bg-white/20 text-white"
                    : "text-sky-100/70 hover:text-white"
                }`}
              >
                {metric === "orders" ? "Orders" : "Revenue"}
              </button>
            ))}
          </div>
        </div>

        {dailyError ? (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {dailyError}
          </div>
        ) : null}

        {dailyLoading ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-sky-100/80">
            Loading trend data…
          </div>
        ) : (
          <TrendChart data={trendSeries} metric={trendMetric} />
        )}
      </div>
    </div>
  );
}

function TrendChart({
  data,
  metric,
}: {
  data: { label: string; value: number }[];
  metric: "orders" | "revenue";
}) {
  const values = data.map((item) => item.value);
  const maxValue = Math.max(1, ...values);
  const minValue = Math.min(0, ...values);
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = data.length === 1 ? 0 : (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return { x, y, value: item.value, label: item.label };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`).join(" ");
  const accent = metric === "orders" ? "stroke-emerald-300" : "stroke-sky-300";

  return (
    <div className="mt-4">
      <div className="relative h-44 w-full">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(125, 211, 252, 0.35)" />
              <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
            </linearGradient>
          </defs>
          <path
            d={`${path} L 100,100 L 0,100 Z`}
            fill="url(#trendFill)"
            className="opacity-40"
          />
          <path d={path} fill="none" strokeWidth="2" className={accent} />
          {points.map((point) => (
            <circle
              key={point.label}
              cx={point.x}
              cy={point.y}
              r="1.6"
              className="fill-white"
            />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-sky-100/70">
          {data.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-sky-100/80">
        <span>
          {metric === "orders" ? "Total orders" : "Total revenue"}:{" "}
          <span className="font-semibold text-white">
            {metric === "orders"
              ? formatCount(values.reduce((sum, val) => sum + val, 0))
              : formatCurrency(values.reduce((sum, val) => sum + val, 0))}
          </span>
        </span>
        <span className="text-xs text-sky-100/60">Last 7 days</span>
      </div>
    </div>
  );
}
