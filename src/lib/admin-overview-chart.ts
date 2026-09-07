export type AdminTrendMetric = "orders" | "revenue" | "netProfit";

export type AdminTrendPoint = {
  dateKey: string;
  label: string;
  orders: number;
  revenue: number;
  netProfit: number;
  costOfGoodsSold: number;
  incompleteProfitOrders: number;
  incompleteProfitItems: number;
};

export const ADMIN_TREND_CHART_KIND = "area" as const;

export function completeAdminTrendSeries(
  datePoints: AdminTrendPoint[],
  dailyStats: Array<Partial<AdminTrendPoint> & Pick<AdminTrendPoint, "dateKey">>,
): AdminTrendPoint[] {
  const byDate = new Map(dailyStats.map((stat) => [stat.dateKey, stat]));
  return datePoints.map((point) => {
    const stat = byDate.get(point.dateKey);
    return {
      ...point,
      orders: Number(stat?.orders ?? 0),
      revenue: Number(stat?.revenue ?? 0),
      netProfit: Number(stat?.netProfit ?? 0),
      costOfGoodsSold: Number(stat?.costOfGoodsSold ?? 0),
      incompleteProfitOrders: Number(stat?.incompleteProfitOrders ?? 0),
      incompleteProfitItems: Number(stat?.incompleteProfitItems ?? 0),
    };
  });
}

export function buildOrderAxisTicks(values: number[]): number[] {
  const maximum = Math.max(0, ...values.map((value) => Math.ceil(value)));
  if (maximum === 0) return [0, 1];
  const roughStep = Math.max(1, Math.ceil(maximum / 4));
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const ceiling = Math.ceil(maximum / niceStep) * niceStep;
  return Array.from({ length: ceiling / niceStep + 1 }, (_, index) => index * niceStep);
}

export function formatAdminChartDzd(value: number): string {
  return `${new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(value)} DZD`;
}

export function formatAdminChartCompactDzd(value: number): string {
  return `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)} DZD`;
}

export function formatAdminChartDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}
