"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, documentId, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
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
const COLOR_BY_DESIGN_THEME: Record<string, string> = {
  simple: "#ffffff",
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
const COUNT_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const CURRENCY_FORMATTER = new Intl.NumberFormat("fr-DZ", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0,
});

type AdminSummary = {
  updatedAt?: Timestamp | Date | string | null;
};

type DailyStat = {
  dateKey: string;
  orders: number;
  revenue: number;
  netProfit: number;
  costOfGoodsSold: number;
  incompleteProfitOrders: number;
  incompleteProfitItems: number;
  topCategories: Record<string, number>;
  topDesignThemes: Record<string, number>;
  topProducts: Record<string, { name: string; qty: number; revenue: number }>;
};

type TrendPoint = {
  dateKey: string;
  label: string;
  orders: number;
  revenue: number;
  netProfit: number;
  costOfGoodsSold: number;
  incompleteProfitOrders: number;
  incompleteProfitItems: number;
};

type RangeKey = "today" | "7d" | "30d" | "month";

const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "month", label: "This month" },
] as const satisfies readonly { key: RangeKey; label: string }[];

type RangeMeta = {
  days: number;
  startKey: string;
  points: TrendPoint[];
};

type StatusCounts = {
  total: number;
  pending: number;
  delivered: number;
  cancelled: number;
  prevPending: number;
  prevDelivered: number;
  prevCancelled: number;
  costOfGoodsSold: number;
  netProfit: number;
  incompleteProfitOrders: number;
  incompleteProfitItems: number;
  prevCostOfGoodsSold: number;
  prevNetProfit: number;
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
      netProfit: 0,
      costOfGoodsSold: 0,
      incompleteProfitOrders: 0,
      incompleteProfitItems: 0,
    });
  }

  return points;
}

function buildDateRangeFromStart(startKey: string, days: number, timeZone: string): TrendPoint[] {
  const [year, month, day] = startKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  const points: TrendPoint[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() + i);
    const dateKey = dateKeyInTZ(date, timeZone);
    points.push({
      dateKey,
      label: dateKey.slice(5),
      orders: 0,
      revenue: 0,
      netProfit: 0,
      costOfGoodsSold: 0,
      incompleteProfitOrders: 0,
      incompleteProfitItems: 0,
    });
  }

  return points;
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const utcTime = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  );
  return utcTime - date.getTime();
}

function addDaysToDateKey(dateKey: string, days: number, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return dateKeyInTZ(anchor, timeZone);
}

function startOfDayInTZ(dateKey: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const offset = getTimeZoneOffset(utcDate, timeZone);
  return new Date(utcDate.getTime() - offset);
}

function endOfDayInTZ(dateKey: string, timeZone: string) {
  const nextDayKey = addDaysToDateKey(dateKey, 1, timeZone);
  const nextStart = startOfDayInTZ(nextDayKey, timeZone);
  return new Date(nextStart.getTime() - 1);
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
  return CURRENCY_FORMATTER.format(value);
}

function formatCount(value: number) {
  return COUNT_FORMATTER.format(value);
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

function normalizeDesignTheme(name: string) {
  return name.trim().toLowerCase();
}

function getCategoryColor(categoryName: string, overrideColor?: string) {
  if (overrideColor) return overrideColor;
  const key = normalizeCategory(categoryName);
  if (COLOR_BY_CATEGORY[key]) return COLOR_BY_CATEGORY[key];
  const idx = hashToIndex(key, AUTO_PALETTE.length);
  return AUTO_PALETTE[idx];
}

function getDesignThemeColor(themeName: string) {
  const key = normalizeDesignTheme(themeName);
  if (COLOR_BY_DESIGN_THEME[key]) return COLOR_BY_DESIGN_THEME[key];
  const idx = hashToIndex(key, AUTO_PALETTE.length);
  return AUTO_PALETTE[idx];
}

type ProductCostInfo = {
  cost: number;
  hasKnownCost: boolean;
};

type ProfitStats = {
  costOfGoodsSold: number;
  netProfit: number;
  incompleteProfitOrders: number;
  incompleteProfitItems: number;
  byDate: Record<string, Omit<ProfitStats, "byDate">>;
};

const emptyProfitStats = (): ProfitStats => ({
  costOfGoodsSold: 0,
  netProfit: 0,
  incompleteProfitOrders: 0,
  incompleteProfitItems: 0,
  byDate: {},
});

function normalizeKnownCost(value: unknown): ProductCostInfo {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  const cost = Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  return { cost, hasKnownCost: cost > 0 };
}

async function loadCurrentProductCosts(db: NonNullable<ReturnType<typeof getDb>>, productIds: string[]) {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  const costs = new Map<string, ProductCostInfo>();
  for (let index = 0; index < uniqueIds.length; index += 30) {
    const chunk = uniqueIds.slice(index, index + 30);
    if (chunk.length === 0) continue;
    const snapshot = await getDocs(query(collection(db, "products"), where(documentId(), "in", chunk)));
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() ?? {};
      costs.set(docSnap.id, normalizeKnownCost(data.costPrice ?? data.purchasePrice));
    });
  }
  return costs;
}

function getOrderProfitStats(
  orderDocs: { data: () => Record<string, unknown> }[],
  currentProductCosts: Map<string, ProductCostInfo>,
) {
  return orderDocs.reduce((acc, docSnap) => {
    const orderData = docSnap.data() ?? {};
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const createdDate = toDateSafe(orderData.createdAt);
    const dateKey = createdDate ? dateKeyInTZ(createdDate, TIME_ZONE) : "unknown";
    const day = acc.byDate[dateKey] ?? {
      costOfGoodsSold: 0,
      netProfit: 0,
      incompleteProfitOrders: 0,
      incompleteProfitItems: 0,
    };
    let orderMissingCost = false;

    items.forEach((item) => {
      const itemData = item as Record<string, unknown>;
      const quantity = typeof itemData.quantity === "number" ? itemData.quantity : 0;
      const price = typeof itemData.price === "number" ? itemData.price : 0;
      const productId = typeof itemData.id === "string" ? itemData.id : "";
      const hasSnapshotCost = typeof itemData.itemCostPrice === "number";
      const snapshotCost = hasSnapshotCost ? normalizeKnownCost(itemData.itemCostPrice) : null;
      const currentCost = productId ? currentProductCosts.get(productId) : undefined;
      const costInfo = snapshotCost ?? currentCost ?? { cost: 0, hasKnownCost: false };
      const knownLineCost = costInfo.hasKnownCost ? costInfo.cost * quantity : 0;
      const estimatedLineProfit = price * quantity - knownLineCost;

      acc.costOfGoodsSold += knownLineCost;
      acc.netProfit += estimatedLineProfit;
      day.costOfGoodsSold += knownLineCost;
      day.netProfit += estimatedLineProfit;

      if (!costInfo.hasKnownCost && quantity > 0) {
        orderMissingCost = true;
        acc.incompleteProfitItems += 1;
        day.incompleteProfitItems += 1;
      }
    });

    if (orderMissingCost) {
      acc.incompleteProfitOrders += 1;
      day.incompleteProfitOrders += 1;
    }

    acc.byDate[dateKey] = day;
    return acc;
  }, emptyProfitStats());
}

function getDeltaInfo(current: number, previous: number) {
  if (previous === 0) {
    return { label: "—", direction: "neutral" as const };
  }
  const diff = current - previous;
  const pct = Math.round((Math.abs(diff) / previous) * 100);
  if (diff > 0) return { label: `${pct}%`, direction: "up" as const };
  if (diff < 0) return { label: `${pct}%`, direction: "down" as const };
  return { label: "0%", direction: "neutral" as const };
}

export function AdminOverviewStats() {
  const [summary, setSummary] = useState<AdminSummary>({
    updatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    total: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
    prevPending: 0,
    prevDelivered: 0,
    prevCancelled: 0,
    costOfGoodsSold: 0,
    netProfit: 0,
    incompleteProfitOrders: 0,
    incompleteProfitItems: 0,
    prevCostOfGoodsSold: 0,
    prevNetProfit: 0,
  });
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [trendMetric, setTrendMetric] = useState<"orders" | "revenue" | "netProfit">("orders");
  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");

  const rangeMeta = useMemo<RangeMeta>(() => {
    const todayKey = dateKeyInTZ(new Date(), TIME_ZONE);
    const [year, month, day] = todayKey.split("-").map(Number);
    let days = 7;

    if (rangeKey === "today") {
      days = 1;
    } else if (rangeKey === "30d") {
      days = 30;
    } else if (rangeKey === "month") {
      days = Math.max(day, 1);
    }

    const points = buildDateRange(days, TIME_ZONE);
    const startKey = rangeKey === "month" ? `${year}-${String(month).padStart(2, "0")}-01` : points[0]?.dateKey;
    return {
      days,
      startKey: startKey ?? todayKey,
      points,
    };
  }, [rangeKey]);

  const previousRangeMeta = useMemo(() => {
    const prevStartKey = addDaysToDateKey(rangeMeta.startKey, -rangeMeta.days, TIME_ZONE);
    return {
      startKey: prevStartKey,
      points: buildDateRangeFromStart(prevStartKey, rangeMeta.days, TIME_ZONE),
    };
  }, [rangeMeta.days, rangeMeta.startKey]);

  const rangeLabel = useMemo(() => {
    if (rangeKey === "today") return "Today";
    if (rangeKey === "month") return "This month";
    return `Last ${rangeMeta.days} days`;
  }, [rangeKey, rangeMeta.days]);

  const rangeLabelShort = useMemo(() => {
    if (rangeKey === "today") return "Today";
    if (rangeKey === "month") return "This month";
    return `${rangeMeta.days}d`;
  }, [rangeKey, rangeMeta.days]);

  const rangeDescription = useMemo(() => {
    if (rangeKey === "today") return "today";
    if (rangeKey === "month") return "this month";
    return `in the last ${rangeMeta.days} days`;
  }, [rangeKey, rangeMeta.days]);

  const previousStartKey = previousRangeMeta.startKey;

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      setDailyLoading(true);
      setDailyError(null);
      setStatusLoading(true);

      const db = getDb();
      if (!db) {
        setError("Firebase is not configured. Please check environment variables.");
        setLoading(false);
        setDailyError("Firebase is not configured. Please check environment variables.");
        setDailyLoading(false);
        setStatusLoading(false);
        return;
      }

      try {
        const summaryRef = doc(db, ...SUMMARY_DOC_PATH);
        const rangeStart = startOfDayInTZ(rangeMeta.startKey, TIME_ZONE);
        const rangeEnd = new Date();
        const prevRangeEnd = new Date(rangeStart.getTime() - 1);
        const prevRangeStart = startOfDayInTZ(previousStartKey, TIME_ZONE);
        const prevRangeEndKey = addDaysToDateKey(rangeMeta.startKey, -1, TIME_ZONE);
        const prevRangeEndDay = endOfDayInTZ(prevRangeEndKey, TIME_ZONE);
        const prevEnd = prevRangeEndDay.getTime() < prevRangeEnd.getTime() ? prevRangeEndDay : prevRangeEnd;
        const dailyQuery = query(
          collection(db, DAILY_COLLECTION),
          orderBy(documentId(), "desc"),
          limit(rangeMeta.days * 2)
        );
        const ordersQuery = query(
          collection(db, "orders"),
          where("createdAt", ">=", rangeStart),
          where("createdAt", "<=", rangeEnd)
        );
        const prevOrdersQuery = query(
          collection(db, "orders"),
          where("createdAt", ">=", prevRangeStart),
          where("createdAt", "<=", prevEnd)
        );
        const categoriesQuery = query(collection(db, "categories"), where("type", "==", "collection"));

        const [summarySnapshot, dailySnapshot, ordersSnapshot, prevOrdersSnapshot, categoriesSnapshot] = await Promise.all([
          getDoc(summaryRef),
          getDocs(dailyQuery),
          getDocs(ordersQuery),
          getDocs(prevOrdersQuery),
          getDocs(categoriesQuery),
        ]);
        const orderProductIds = [...ordersSnapshot.docs, ...prevOrdersSnapshot.docs].flatMap((docSnap) => {
          const orderData = docSnap.data() ?? {};
          const items = Array.isArray(orderData.items) ? orderData.items : [];
          return items
            .map((item) => (item && typeof item === "object" ? (item as { id?: unknown }).id : null))
            .filter((id): id is string => typeof id === "string" && id.length > 0);
        });
        const currentProductCosts = await loadCurrentProductCosts(db, orderProductIds);
        const currentProfitStats = getOrderProfitStats(ordersSnapshot.docs, currentProductCosts);
        const previousProfitStats = getOrderProfitStats(prevOrdersSnapshot.docs, currentProductCosts);

        const data = summarySnapshot.data() ?? {};
        setSummary({
          updatedAt: data.updatedAt ?? null,
        });

        const daily = dailySnapshot.docs
          .map((docSnap) => {
            const dailyData = docSnap.data() ?? {};
            return {
              dateKey: docSnap.id,
              orders: Number(dailyData.orders ?? 0),
              revenue: Number(dailyData.revenue ?? 0),
              netProfit: currentProfitStats.byDate[docSnap.id]?.netProfit ?? previousProfitStats.byDate[docSnap.id]?.netProfit ?? 0,
              costOfGoodsSold:
                currentProfitStats.byDate[docSnap.id]?.costOfGoodsSold ??
                previousProfitStats.byDate[docSnap.id]?.costOfGoodsSold ??
                0,
              incompleteProfitOrders:
                currentProfitStats.byDate[docSnap.id]?.incompleteProfitOrders ??
                previousProfitStats.byDate[docSnap.id]?.incompleteProfitOrders ??
                0,
              incompleteProfitItems:
                currentProfitStats.byDate[docSnap.id]?.incompleteProfitItems ??
                previousProfitStats.byDate[docSnap.id]?.incompleteProfitItems ??
                0,
              topCategories:
                typeof dailyData.topCategories === "object" && dailyData.topCategories
                  ? (dailyData.topCategories as Record<string, number>)
                  : {},
              topDesignThemes:
                typeof dailyData.topDesignThemes === "object" && dailyData.topDesignThemes
                  ? (dailyData.topDesignThemes as Record<string, number>)
                  : {},
              topProducts:
                typeof dailyData.topProducts === "object" && dailyData.topProducts
                  ? (dailyData.topProducts as Record<string, { name: string; qty: number; revenue: number }>)
                  : {},
            };
          })
          .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        setDailyStats(daily);

        const nextStatusCounts: StatusCounts = {
          total: ordersSnapshot.size,
          pending: 0,
          delivered: 0,
          cancelled: 0,
          prevPending: 0,
          prevDelivered: 0,
          prevCancelled: 0,
          costOfGoodsSold: currentProfitStats.costOfGoodsSold,
          netProfit: currentProfitStats.netProfit,
          incompleteProfitOrders: currentProfitStats.incompleteProfitOrders,
          incompleteProfitItems: currentProfitStats.incompleteProfitItems,
          prevCostOfGoodsSold: previousProfitStats.costOfGoodsSold,
          prevNetProfit: previousProfitStats.netProfit,
        };
        ordersSnapshot.docs.forEach((docSnap) => {
          const orderData = docSnap.data() ?? {};
          const status = typeof orderData.status === "string" ? orderData.status : "pending";
          if (status === "pending") nextStatusCounts.pending += 1;
          if (status === "delivered") nextStatusCounts.delivered += 1;
          if (status === "cancelled") nextStatusCounts.cancelled += 1;
        });
        prevOrdersSnapshot.docs.forEach((docSnap) => {
          const orderData = docSnap.data() ?? {};
          const status = typeof orderData.status === "string" ? orderData.status : "pending";
          if (status === "pending") nextStatusCounts.prevPending += 1;
          if (status === "delivered") nextStatusCounts.prevDelivered += 1;
          if (status === "cancelled") nextStatusCounts.prevCancelled += 1;
        });
        setStatusCounts(nextStatusCounts);

        const nextCategoryColors: Record<string, string> = {};
        categoriesSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() ?? {};
          const rawColor = typeof data.color === "string" ? data.color.trim() : "";
          if (!rawColor) return;
          const slug = typeof data.slug === "string" ? data.slug : docSnap.id;
          const label = typeof data.name === "string" ? data.name : typeof data.label === "string" ? data.label : "";
          nextCategoryColors[normalizeCategory(slug)] = rawColor;
          if (label) {
            nextCategoryColors[normalizeCategory(label)] = rawColor;
          }
        });
        setCategoryColors(nextCategoryColors);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load admin stats";
        setError(message);
        setDailyError(message);
      } finally {
        setLoading(false);
        setDailyLoading(false);
        setStatusLoading(false);
      }
    };

    loadSummary();
  }, [previousStartKey, rangeMeta.days, rangeMeta.startKey]);

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

  const dailyStatsByKey = useMemo(
    () => new Map(dailyStats.map((stat) => [stat.dateKey, stat])),
    [dailyStats]
  );

  const trendSeries = useMemo(() => {
    return rangeMeta.points.map((point) => {
      const match = dailyStatsByKey.get(point.dateKey);
      return {
        ...point,
        orders: match?.orders ?? 0,
        revenue: match?.revenue ?? 0,
        netProfit: match?.netProfit ?? 0,
        costOfGoodsSold: match?.costOfGoodsSold ?? 0,
        incompleteProfitOrders: match?.incompleteProfitOrders ?? 0,
        incompleteProfitItems: match?.incompleteProfitItems ?? 0,
      };
    });
  }, [dailyStatsByKey, rangeMeta.points]);

  const previousTrendSeries = useMemo(() => {
    return previousRangeMeta.points.map((point) => {
      const match = dailyStatsByKey.get(point.dateKey);
      return {
        ...point,
        orders: match?.orders ?? 0,
        revenue: match?.revenue ?? 0,
        netProfit: match?.netProfit ?? 0,
        costOfGoodsSold: match?.costOfGoodsSold ?? 0,
        incompleteProfitOrders: match?.incompleteProfitOrders ?? 0,
        incompleteProfitItems: match?.incompleteProfitItems ?? 0,
      };
    });
  }, [dailyStatsByKey, previousRangeMeta.points]);

  const currentOrdersTotal = useMemo(
    () => trendSeries.reduce((sum, item) => sum + item.orders, 0),
    [trendSeries]
  );
  const currentRevenueTotal = useMemo(
    () => trendSeries.reduce((sum, item) => sum + item.revenue, 0),
    [trendSeries]
  );
  const previousOrdersTotal = useMemo(
    () => previousTrendSeries.reduce((sum, item) => sum + item.orders, 0),
    [previousTrendSeries]
  );
  const previousRevenueTotal = useMemo(
    () => previousTrendSeries.reduce((sum, item) => sum + item.revenue, 0),
    [previousTrendSeries]
  );
  const currentNetProfitTotal = useMemo(
    () => trendSeries.reduce((sum, item) => sum + item.netProfit, 0),
    [trendSeries]
  );
  const deliveryRate = useMemo(
    () => (statusCounts.total > 0 ? (statusCounts.delivered / statusCounts.total) * 100 : null),
    [statusCounts.delivered, statusCounts.total]
  );
  const cancelRate = useMemo(
    () => (statusCounts.total > 0 ? (statusCounts.cancelled / statusCounts.total) * 100 : null),
    [statusCounts.cancelled, statusCounts.total]
  );
  const pendingRate = useMemo(
    () => (statusCounts.total > 0 ? (statusCounts.pending / statusCounts.total) * 100 : null),
    [statusCounts.pending, statusCounts.total]
  );

  const cards = useMemo(
    () => [
      {
        title: "Orders",
        value: formatCount(currentOrdersTotal),
        description: `Orders placed ${rangeDescription}.`,
        delta: getDeltaInfo(currentOrdersTotal, previousOrdersTotal),
        accent: "from-sky-500/20 via-sky-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M4 7h16l-1.5 9a2 2 0 0 1-2 1.6H7.5a2 2 0 0 1-2-1.6L4 7Z" />
            <path strokeWidth="1.5" d="M9 11h6" />
          </svg>
        ),
      },
      {
        title: "Revenue",
        value: formatCurrency(currentRevenueTotal),
        description: `Gross sales ${rangeDescription}.`,
        delta: getDeltaInfo(currentRevenueTotal, previousRevenueTotal),
        accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor">
            <path
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v18M16 7a4 4 0 0 0-8 0c0 2.5 8 2.5 8 5a4 4 0 0 1-8 0"
            />
          </svg>
        ),
      },
      {
        title: "Net profit",
        value: statusLoading ? "—" : formatCurrency(statusCounts.netProfit),
        description:
          statusCounts.incompleteProfitOrders > 0
            ? `Estimated — missing cost for ${statusCounts.incompleteProfitOrders} order(s) / ${statusCounts.incompleteProfitItems} item(s).`
            : `Snapshot profit ${rangeDescription}.`,
        delta: getDeltaInfo(statusCounts.netProfit, statusCounts.prevNetProfit),
        accent: "from-cyan-500/20 via-cyan-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 17l6-6 4 4 6-8" />
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 7h5v5" />
          </svg>
        ),
      },
      {
        title: "Cost of goods sold",
        value: statusLoading ? "—" : formatCurrency(statusCounts.costOfGoodsSold),
        description:
          statusCounts.incompleteProfitItems > 0
            ? `Known costs only; ${statusCounts.incompleteProfitItems} item(s) missing cost.`
            : `Known product costs ${rangeDescription}.`,
        delta: getDeltaInfo(statusCounts.costOfGoodsSold, statusCounts.prevCostOfGoodsSold),
        accent: "from-violet-500/20 via-violet-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M4 7h16M6 7v11h12V7" />
            <path strokeWidth="1.5" d="M9 11h6" />
          </svg>
        ),
      },
      {
        title: "Pending orders",
        value: statusLoading ? "—" : formatCount(statusCounts.pending),
        description: `Pending orders created ${rangeDescription}.`,
        rateLabel: "Pending rate",
        rateValue: pendingRate,
        delta: getDeltaInfo(statusCounts.pending, statusCounts.prevPending),
        accent: "from-amber-500/20 via-amber-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="7" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        title: "Delivered orders",
        value: statusLoading ? "—" : formatCount(statusCounts.delivered),
        description: `Delivered orders created ${rangeDescription}.`,
        rateLabel: "Delivery rate",
        rateValue: deliveryRate,
        delta: getDeltaInfo(statusCounts.delivered, statusCounts.prevDelivered),
        accent: "from-emerald-400/20 via-emerald-400/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M5 12l4 4L19 7" />
          </svg>
        ),
      },
      {
        title: "Cancelled orders",
        value: statusLoading ? "—" : formatCount(statusCounts.cancelled),
        description: `Cancelled orders created ${rangeDescription}.`,
        rateLabel: "Cancel rate",
        rateValue: cancelRate,
        delta: getDeltaInfo(statusCounts.cancelled, statusCounts.prevCancelled),
        accent: "from-rose-500/20 via-rose-500/5 to-transparent",
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-rose-200" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M6 6l12 12M18 6l-12 12" />
          </svg>
        ),
      },
    ],
    [
      currentOrdersTotal,
      currentRevenueTotal,
      previousOrdersTotal,
      previousRevenueTotal,
      deliveryRate,
      cancelRate,
      pendingRate,
      rangeDescription,
      statusCounts.cancelled,
      statusCounts.delivered,
      statusCounts.pending,
      statusCounts.costOfGoodsSold,
      statusCounts.incompleteProfitOrders,
      statusCounts.incompleteProfitItems,
      statusCounts.netProfit,
      statusCounts.prevCostOfGoodsSold,
      statusCounts.prevNetProfit,
      statusCounts.prevDelivered,
      statusCounts.prevCancelled,
      statusCounts.prevPending,
      statusLoading,
    ]
  );

  const rangeKeys = useMemo(
    () => new Set(rangeMeta.points.map((point) => point.dateKey)),
    [rangeMeta.points]
  );

  const topCategoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    dailyStats.forEach((stat) => {
      if (!rangeKeys.has(stat.dateKey)) return;
      Object.entries(stat.topCategories).forEach(([category, revenue]) => {
        totals[category] = (totals[category] ?? 0) + revenue;
      });
    });
    return Object.entries(totals)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [dailyStats, rangeKeys]);

  const topDesignData = useMemo(() => {
    const totals: Record<string, number> = {};
    dailyStats.forEach((stat) => {
      if (!rangeKeys.has(stat.dateKey)) return;
      Object.entries(stat.topDesignThemes ?? {}).forEach(([theme, revenue]) => {
        const key = theme.trim() || "Unknown";
        totals[key] = (totals[key] ?? 0) + revenue;
      });
    });
    return Object.entries(totals)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [dailyStats, rangeKeys]);

  const topProducts = useMemo(() => {
    const totals: Record<string, { name: string; qty: number; revenue: number }> = {};
    dailyStats.forEach((stat) => {
      if (!rangeKeys.has(stat.dateKey)) return;
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
  }, [dailyStats, rangeKeys]);

  const topProductMaxRevenue = useMemo(
    () => topProducts.reduce((max, product) => Math.max(max, product.revenue), 0),
    [topProducts]
  );

  const chartMoneyKey = trendMetric === "netProfit" ? "netProfit" : "revenue";
  const chartMoneyLabel = trendMetric === "netProfit" ? "Net profit" : "Revenue";
  const chartMoneyTotal = trendMetric === "netProfit" ? currentNetProfitTotal : currentRevenueTotal;
  const chartIncompleteProfitOrders = useMemo(
    () => trendSeries.reduce((sum, item) => sum + item.incompleteProfitOrders, 0),
    [trendSeries]
  );
  const chartIncompleteProfitItems = useMemo(
    () => trendSeries.reduce((sum, item) => sum + item.incompleteProfitItems, 0),
    [trendSeries]
  );
  const chartSummaryValue = useMemo(() => {
    if (trendMetric === "orders") return `${formatCount(currentOrdersTotal)} orders`;
    const suffix =
      trendMetric === "netProfit" && chartIncompleteProfitItems > 0
        ? ` (estimated; missing cost for ${chartIncompleteProfitOrders} order(s) / ${chartIncompleteProfitItems} item(s))`
        : "";
    return `${formatCurrency(chartMoneyTotal)}${suffix}`;
  }, [chartIncompleteProfitItems, chartIncompleteProfitOrders, chartMoneyTotal, currentOrdersTotal, trendMetric]);

  const isChartEmpty = useMemo(
    () => trendSeries.every((point) => point.orders === 0 && point.revenue === 0 && point.netProfit === 0),
    [trendSeries]
  );
  const donutData = useMemo(
    () =>
      topCategoryData.map((category) => {
        const override = categoryColors[normalizeCategory(category.name)];
        return {
          name: category.name,
          value: category.revenue,
          color: getCategoryColor(category.name, override),
        };
      }),
    [categoryColors, topCategoryData]
  );
  const donutTotal = useMemo(
    () => donutData.reduce((sum, item) => sum + (item.value || 0), 0),
    [donutData]
  );
  const donutLegendItems = useMemo(
    () =>
      donutData
        .slice()
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 5)
        .map((item) => ({
          ...item,
          percent: donutTotal > 0 ? Math.round(((item.value || 0) / donutTotal) * 100) : 0,
        })),
    [donutData, donutTotal]
  );

  const designDonutData = useMemo(
    () =>
      topDesignData.map((theme) => ({
        name: theme.name,
        value: theme.revenue,
        color: getDesignThemeColor(theme.name),
      })),
    [topDesignData]
  );
  const designDonutTotal = useMemo(
    () => designDonutData.reduce((sum, item) => sum + (item.value || 0), 0),
    [designDonutData]
  );
  const designDonutLegendItems = useMemo(
    () =>
      designDonutData
        .slice()
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 5)
        .map((item) => ({
          ...item,
          percent: designDonutTotal > 0 ? Math.round(((item.value || 0) / designDonutTotal) * 100) : 0,
        })),
    [designDonutData, designDonutTotal]
  );

  return (
    <div className="admin-dashboard space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sky-100/80">
        <div className="space-y-1">
          <span>Snapshot of orders, revenue, and performance trends.</span>
          <p className="text-xs text-sky-100/70">Last updated: {lastUpdatedLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-sky-200">Date range</span>
          <div className="flex gap-2 rounded-full bg-white/5 p-1 text-xs font-semibold text-sky-100">
            {RANGE_OPTIONS.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => setRangeKey(range.key)}
                className={`rounded-full px-3 py-1 transition ${
                  rangeKey === range.key ? "bg-white/20 text-white" : "text-sky-100/70 hover:text-white"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
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
            className={`admin-dashboard-card relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-5 shadow-inner shadow-sky-900/30`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-200">{card.title}</p>
              <span className="rounded-full bg-white/10 p-2">{card.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-3 text-sm text-sky-100/80">{card.description}</p>
            {card.rateLabel ? (
              <p className="mt-2 text-xs text-sky-100/60">
                {card.rateLabel}: {card.rateValue === null ? "—" : `${Math.round(card.rateValue)}%`}
              </p>
            ) : null}
            <div className="mt-3 flex items-center justify-between text-xs text-sky-100/70">
              <div className="flex items-center gap-1">
                <span
                  className={
                    card.delta.direction === "up"
                      ? "text-emerald-300"
                      : card.delta.direction === "down"
                        ? "text-rose-300"
                        : "text-sky-100/60"
                  }
                >
                  {card.delta.label === "—"
                    ? "—"
                    : card.delta.direction === "up"
                      ? "▲"
                      : card.delta.direction === "down"
                        ? "▼"
                        : "•"}
                </span>
                <span
                  className={
                    card.delta.direction === "up"
                      ? "text-emerald-200"
                      : card.delta.direction === "down"
                        ? "text-rose-200"
                        : "text-sky-100/70"
                  }
                >
                  {card.delta.label}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-sky-100/60">vs prev period</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="admin-dashboard-card rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-sky-900/30 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Sales Analytics</p>
              <h3 className="text-lg font-semibold text-white">Orders & revenue overview</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2 rounded-full bg-white/5 p-1 text-xs font-semibold text-sky-100">
                {(["orders", "revenue", "netProfit"] as const).map((metric) => (
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
                    {metric === "orders" ? "Orders" : metric === "revenue" ? "Revenue" : "Net profit"}
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
              <p className="text-base font-semibold text-white">No data yet for {rangeLabel}</p>
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
                    tickFormatter={(value) =>
                      trendMetric === "orders" ? formatCount(Number(value)) : `${formatCount(Number(value))} DA`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const ordersValue = payload.find((entry) => entry.dataKey === "orders")?.value ?? 0;
                      const moneyValue = payload.find((entry) => entry.dataKey === chartMoneyKey)?.value ?? 0;
                      const point = payload[0]?.payload as TrendPoint | undefined;
                      return (
                        <div className="rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-sky-100 shadow-xl">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-sky-200">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {formatCount(Number(ordersValue))} orders
                          </p>
                          <p className="text-sm text-sky-100/80">
                            {chartMoneyLabel}: {formatCurrency(Number(moneyValue))}
                          </p>
                          {trendMetric === "netProfit" && point && point.incompleteProfitItems > 0 ? (
                            <p className="mt-1 text-[11px] text-amber-100/80">
                              Estimated — missing cost for {point.incompleteProfitOrders} order(s) / {point.incompleteProfitItems} item(s).
                            </p>
                          ) : null}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="orders" fill="rgba(14, 165, 233, 0.6)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Area
                    dataKey={chartMoneyKey}
                    stroke="rgba(52, 211, 153, 0.8)"
                    fill="rgba(52, 211, 153, 0.15)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between text-sm text-sky-100/80">
            <span className="text-xs uppercase tracking-[0.18em] text-sky-200">{rangeLabel}</span>
            <span>
              {chartSummaryValue}
            </span>
          </div>
        </div>

        <div className="admin-dashboard-card rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.2em] text-white/60">TOP CATEGORIES</div>
              <div className="text-lg font-semibold text-white">{rangeLabel}</div>
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
                        isAnimationActive={false}
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
                        Total ({rangeLabelShort})
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
                {donutLegendItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="truncate text-sm text-white/90">{item.name}</span>
                    </div>
                    <div className="text-sm text-white/80 tabular-nums">
                      {item.percent}% • {formatCount(item.value || 0)} DA
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="admin-dashboard-card rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.2em] text-white/60">TOP DESIGNS</div>
              <div className="text-lg font-semibold text-white">{rangeLabel}</div>
            </div>
            <div className="text-xs text-white/60">Revenue share</div>
          </div>
          {designDonutData.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-sky-100/80">
              No design theme data yet.
            </div>
          ) : (
            <>
              <div className="mt-5 flex items-center justify-center">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={designDonutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={2}
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1}
                        isAnimationActive={false}
                      >
                        {designDonutData.map((entry, index) => (
                          <Cell key={`design-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <text
                        x="50%"
                        y="48%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white text-sm font-semibold"
                      >
                        {formatCount(designDonutTotal)} DA
                      </text>
                      <text
                        x="50%"
                        y="60%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white/60 text-xs"
                      >
                        Total ({rangeLabelShort})
                      </text>
                      <Tooltip
                        formatter={(value: number, _name: string, props: { payload?: { name?: string } }) => {
                          const numeric = Number(value || 0);
                          const pct = designDonutTotal > 0 ? Math.round((numeric / designDonutTotal) * 100) : 0;
                          return [`${formatCount(numeric)} DA (${pct}%)`, props?.payload?.name ?? "Design"];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {designDonutLegendItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="truncate text-sm text-white/90">{item.name}</span>
                    </div>
                    <div className="text-sm text-white/80 tabular-nums">
                      {item.percent}% • {formatCount(item.value || 0)} DA
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="admin-dashboard-card relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Top Products</p>
              <h3 className="text-lg font-semibold text-white">{rangeLabel}</h3>
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
                <div key={product.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-sky-100/60">#{index + 1}</p>
                      <p className="truncate font-semibold text-white">{product.name}</p>
                      <p className="text-xs text-sky-100/60">{formatCount(product.qty)} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-sky-100/60">Revenue</p>
                      <p className="font-semibold text-white">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-sky-400/70"
                      style={{
                        width: topProductMaxRevenue
                          ? `${Math.max(6, Math.round((product.revenue / topProductMaxRevenue) * 100))}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
