"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, documentId, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDb } from "@/lib/firebaseClient";
import { dateKeyInTZ } from "@/lib/dateKeys";

const SUMMARY_DOC_PATH = ["adminStats", "summary"] as const;
const DAILY_COLLECTION = "adminStatsDaily";
const TIME_ZONE = "Africa/Algiers";
const COLOR_BY_CATEGORY: Record<string, string> = {
  hoodies: "#3B82F6",
  pants: "#7F1D1D",
  sweatshirts: "#064E3B",
  ensembles: "#6D28D9",
  tshirts: "#FACC15",
};
const AUTO_PALETTE = [
  "#22C55E",
  "#06B6D4",
  "#A855F7",
  "#F97316",
  "#EF4444",
  "#84CC16",
  "#14B8A6",
  "#EAB308",
  "#6366F1",
  "#EC4899",
];

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
  topCategories: Record<string, number>;
  topProducts: Record<string, { name: string; qty: number; revenue: number }>;
};

type TrendPoint = {
  dateKey: string;
  label: string;
  orders: number;
  revenue: number;
};

function buildDateRange(days: number, timeZone: string): TrendPoint[] {
  const todayKey = dateKeyInTZ(new Date(), timeZone);
  const [year, month, day] = todayKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  const points: TrendPoint[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() - i);
    const dateKey = dateKeyInTZ(date, timeZone);
    points.push({
      dateKey,
      label: dateKey.slice(5),
      orders: 0,
      revenue: 0,
    });
  }

  return points;
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

function hashToIndex(input: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

function normalizeCategory(name: string) {
  return name.trim().toLowerCase();
}

function getCategoryColor(categoryName: string) {
  const key = normalizeCategory(categoryName);
  if (COLOR_BY_CATEGORY[key]) return COLOR_BY_CATEGORY[key];
  const idx = hashToIndex(key, AUTO_PALETTE.length);
  return AUTO_PALETTE[idx];
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
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);

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
          limit(rangeDays)
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
              topCategories:
                typeof dailyData.topCategories === "object" && dailyData.topCategories
                  ? (dailyData.topCategories as Record<string, number>)
                  : {},
              topProducts:
                typeof dailyData.topProducts === "object" && dailyData.topProducts
                  ? (dailyData.topProducts as Record<string, { name: string; qty: number; revenue: number }>)
                  : {},
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
  }, [rangeDays]);

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
        accent: "from-sky-500/20 via-sky-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M4 7h16l-1.5 9a2 2 0 0 1-2 1.6H7.5a2 2 0 0 1-2-1.6L4 7Z" />
            <path strokeWidth="1.5" d="M9 11h6" />
          </svg>
        ),
      },
      {
        title: "Total revenue",
        value: formatCurrency(summary.totalRevenue),
        description: "Total gross sales across all orders.",
        accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M4 12h16M7 8h10M9 16h6" />
          </svg>
        ),
      },
      {
        title: "Orders today",
        value: formatCount(summary.ordersToday),
        description: "Orders placed since midnight.",
        accent: "from-indigo-500/20 via-indigo-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-200" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="7" strokeWidth="1.5" />
            <path strokeWidth="1.5" d="M12 8v4l3 2" />
          </svg>
        ),
      },
      {
        title: "Orders this week",
        value: formatCount(summary.ordersThisWeek),
        description: "Orders placed during the current week.",
        accent: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-fuchsia-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M5 5h14v14H5z" />
            <path strokeWidth="1.5" d="M8 3v4M16 3v4" />
          </svg>
        ),
      },
      {
        title: "Pending orders",
        value: formatCount(summary.pendingOrders),
        description: "Orders still awaiting fulfilment.",
        accent: "from-amber-500/20 via-amber-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="7" strokeWidth="1.5" />
          </svg>
        ),
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
    const range = buildDateRange(rangeDays, TIME_ZONE);
    const dailyMap = new Map(dailyStats.map((stat) => [stat.dateKey, stat]));
    return range.map((point) => {
      const match = dailyMap.get(point.dateKey);
      return {
        ...point,
        orders: match?.orders ?? 0,
        revenue: match?.revenue ?? 0,
      };
    });
  }, [dailyStats, rangeDays]);

  const lastSevenKeys = useMemo(() => new Set(buildDateRange(7, TIME_ZONE).map((point) => point.dateKey)), []);

  const topCategoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    dailyStats.forEach((stat) => {
      if (!lastSevenKeys.has(stat.dateKey)) return;
      Object.entries(stat.topCategories).forEach(([category, revenue]) => {
        totals[category] = (totals[category] ?? 0) + revenue;
      });
    });
    return Object.entries(totals)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [dailyStats, lastSevenKeys]);

  const topProducts = useMemo(() => {
    const totals: Record<string, { name: string; qty: number; revenue: number }> = {};
    dailyStats.forEach((stat) => {
      if (!lastSevenKeys.has(stat.dateKey)) return;
      Object.entries(stat.topProducts).forEach(([productId, product]) => {
        const existing = totals[productId] ?? { name: product.name, qty: 0, revenue: 0 };
        totals[productId] = {
          name: existing.name || product.name,
          qty: existing.qty + product.qty,
          revenue: existing.revenue + product.revenue,
        };
      });
    });
    return Object.entries(totals)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [dailyStats, lastSevenKeys]);

  const isChartEmpty = trendSeries.every((point) => point.orders === 0 && point.revenue === 0);
  const donutData = useMemo(
    () =>
      topCategoryData.map((category) => ({
        name: category.name,
        value: category.revenue,
        color: getCategoryColor(category.name),
      })),
    [topCategoryData]
  );
  const donutTotal = useMemo(
    () => donutData.reduce((sum, item) => sum + (item.value || 0), 0),
    [donutData]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-sky-100/80">
        <span>Snapshot of orders, revenue, and performance trends.</span>
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
            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-5 shadow-inner shadow-sky-900/30`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-200">{card.title}</p>
              <span className="rounded-full bg-white/10 p-2">{card.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-3 text-sm text-sky-100/80">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Sales Analytics</p>
              <h3 className="text-lg font-semibold text-white">Orders & revenue overview</h3>
            </div>
            <div className="flex flex-wrap gap-2">
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
              <div className="flex gap-2 rounded-full bg-white/5 p-1 text-xs font-semibold text-sky-100">
                {([7, 30] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRangeDays(days)}
                    className={`rounded-full px-3 py-1 transition ${
                      rangeDays === days ? "bg-white/20 text-white" : "text-sky-100/70 hover:text-white"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {dailyError ? (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {dailyError}
            </div>
          ) : null}

          {dailyLoading ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-sm text-sky-100/80">
              Loading analytics…
            </div>
          ) : isChartEmpty ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-10 text-center text-sm text-sky-100/80">
              <p className="text-base font-semibold text-white">No data yet for the last {rangeDays} days</p>
              <p className="mt-2 text-xs text-sky-100/70">Create a test order to populate analytics.</p>
            </div>
          ) : (
            <div className="mt-6 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendSeries}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(226, 232, 240, 0.7)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={40}
                    tick={{ fill: "rgba(226, 232, 240, 0.7)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const ordersValue = payload.find((entry) => entry.dataKey === "orders")?.value ?? 0;
                      const revenueValue = payload.find((entry) => entry.dataKey === "revenue")?.value ?? 0;
                      return (
                        <div className="rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-sky-100 shadow-xl">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-sky-200">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {formatCount(Number(ordersValue))} orders
                          </p>
                          <p className="text-sm text-sky-100/80">{formatCurrency(Number(revenueValue))}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="orders" fill="rgba(14, 165, 233, 0.6)" radius={[6, 6, 0, 0]} />
                  <Area
                    dataKey="revenue"
                    stroke="rgba(52, 211, 153, 0.8)"
                    fill="rgba(52, 211, 153, 0.15)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between text-sm text-sky-100/80">
            <span className="text-xs uppercase tracking-[0.18em] text-sky-200">Last {rangeDays} days</span>
            <span>
              {trendMetric === "orders"
                ? `${formatCount(trendSeries.reduce((sum, item) => sum + item.orders, 0))} orders`
                : formatCurrency(trendSeries.reduce((sum, item) => sum + item.revenue, 0))}
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs tracking-[0.2em] text-white/60">TOP CATEGORIES</div>
                <div className="text-lg font-semibold text-white">Last 7 days</div>
              </div>
              <div className="text-xs text-white/60">Revenue share</div>
            </div>
            {donutData.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-sky-100/80">
                No category data yet.
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center justify-center">
                  <div className="h-[200px] w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={2}
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth={1}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <text
                          x="50%"
                          y="48%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white text-sm font-semibold"
                        >
                          {formatCount(donutTotal)} DA
                        </text>
                        <text
                          x="50%"
                          y="60%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white/60 text-xs"
                        >
                          Total (7d)
                        </text>
                        <Tooltip
                          formatter={(value: number, _name: string, props: { payload?: { name?: string } }) => {
                            const numeric = Number(value || 0);
                            const pct = donutTotal > 0 ? Math.round((numeric / donutTotal) * 100) : 0;
                            return [`${formatCount(numeric)} DA (${pct}%)`, props?.payload?.name ?? "Category"];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {donutData
                    .slice()
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 5)
                    .map((item) => {
                      const pct = donutTotal > 0 ? Math.round(((item.value || 0) / donutTotal) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                            <span className="truncate text-sm text-white/90">{item.name}</span>
                          </div>
                          <div className="text-sm text-white/80 tabular-nums">
                            {pct}% • {formatCount(item.value || 0)} DA
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Top Products</p>
                <h3 className="text-lg font-semibold text-white">Last 7 days</h3>
              </div>
              <span className="text-xs text-sky-100/60">Top 5</span>
            </div>
            {topProducts.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-sky-100/80">
                No product data yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-sky-100/85">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs text-sky-100/60">#{index + 1}</p>
                      <p className="font-semibold text-white">{product.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-sky-100/60">{formatCount(product.qty)} items</p>
                      <p className="font-semibold text-white">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
