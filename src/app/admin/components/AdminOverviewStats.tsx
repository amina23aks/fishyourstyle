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

type TrendPoint = {
  dateKey: string;
  label: string;
  orders: number;
  revenue: number;
};

function formatDateKeyUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildLastSevenDaysUTC(): TrendPoint[] {
  const today = new Date();
  const days: TrendPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    date.setUTCDate(date.getUTCDate() - i);
    const dateKey = formatDateKeyUTC(date);
    days.push({
      dateKey,
      label: dateKey.slice(5),
      orders: 0,
      revenue: 0,
    });
  }
  return days;
}

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
    const lastSeven = buildLastSevenDaysUTC();
    const dailyMap = new Map(dailyStats.map((stat) => [stat.dateKey, stat]));
    return lastSeven.map((point) => {
      const match = dailyMap.get(point.dateKey);
      return {
        ...point,
        orders: match?.orders ?? 0,
        revenue: match?.revenue ?? 0,
      };
    });
  }, [dailyStats]);

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
  data: TrendPoint[];
  metric: "orders" | "revenue";
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const values = data.map((item) => (metric === "orders" ? item.orders : item.revenue));
  const maxValue = Math.max(1, ...values);
  const range = maxValue || 1;
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const value = metric === "orders" ? item.orders : item.revenue;
    const y = 100 - (value / range) * 100;
    return { x, y, value, label: item.label, dateKey: item.dateKey };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`).join(" ");
  const accent = metric === "orders" ? "stroke-emerald-300" : "stroke-sky-300";
  const isEmpty = values.every((value) => value === 0);

  return (
    <div className="mt-4">
      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-sky-100/80">
          <p className="text-base font-semibold text-white">No data yet for the last 7 days</p>
          <p className="mt-2 text-xs text-sky-100/70">Create a test order to populate trends.</p>
        </div>
      ) : (
        <div className="relative h-44 w-full">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {[20, 40, 60, 80].map((line) => (
              <line
                key={line}
                x1="0"
                x2="100"
                y1={line}
                y2={line}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="0.6"
              />
            ))}
            <path d={path} fill="none" strokeWidth="2.2" className={accent} />
            {points.map((point, index) => (
              <g key={point.dateKey}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoverIndex === index ? 2.6 : 1.8}
                  className={hoverIndex === index ? "fill-white" : "fill-sky-100"}
                />
              </g>
            ))}
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-sky-100/70">
            {data.map((item) => (
              <span key={item.dateKey}>{item.label}</span>
            ))}
          </div>
          <div className="absolute inset-0">
            {points.map((point, index) => (
              <button
                key={point.dateKey}
                type="button"
                aria-label={`View ${point.dateKey}`}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                className="absolute top-0 h-full -translate-x-1/2"
                style={{ left: `${point.x}%`, width: "14%" }}
              />
            ))}
          </div>
          {hoverIndex !== null ? (
            <div
              className="absolute -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-sky-100 shadow-xl"
              style={{
                left: `${points[hoverIndex].x}%`,
                top: `${Math.max(points[hoverIndex].y - 18, 6)}%`,
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-sky-200">
                {points[hoverIndex].dateKey}
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {metric === "orders"
                  ? formatCount(points[hoverIndex].value)
                  : formatCurrency(points[hoverIndex].value)}
              </div>
            </div>
          ) : null}
        </div>
      )}
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
