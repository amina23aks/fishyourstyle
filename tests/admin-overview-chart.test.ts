import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ADMIN_TREND_CHART_KIND,
  buildOrderAxisTicks,
  completeAdminTrendSeries,
  formatAdminChartCompactDzd,
  formatAdminChartDate,
  formatAdminChartDzd,
  type AdminTrendPoint,
} from "../src/lib/admin-overview-chart";

const emptyPoint = (dateKey: string): AdminTrendPoint => ({
  dateKey,
  label: dateKey.slice(5),
  orders: 0,
  revenue: 0,
  netProfit: 0,
  costOfGoodsSold: 0,
  incompleteProfitOrders: 0,
  incompleteProfitItems: 0,
});

test("overview uses one line/area chart and no bar series", () => {
  const component = readFileSync(
    "src/app/[locale]/admin/components/AdminOverviewStats.tsx",
    "utf8",
  );
  assert.equal(ADMIN_TREND_CHART_KIND, "area");
  assert.match(component, /<AreaChart/);
  assert.match(component, /<Area\s/);
  assert.doesNotMatch(component, /<Bar\s/);
});

test("complete 30-day series retains zero-order calendar days", () => {
  const points = Array.from({ length: 30 }, (_, index) =>
    emptyPoint(`2026-08-${String(index + 1).padStart(2, "0")}`),
  );
  const series = completeAdminTrendSeries(points, [
    { dateKey: "2026-08-29", orders: 2, revenue: 18400, netProfit: 6100 },
  ]);
  assert.equal(series.length, 30);
  assert.equal(series[27].orders, 0);
  assert.equal(series[28].orders, 2);
  assert.equal(series[29].orders, 0);
});

test("orders, revenue and net profit values pass through without recalculation", () => {
  const series = completeAdminTrendSeries([emptyPoint("2026-08-30")], [
    { dateKey: "2026-08-30", orders: 7, revenue: 18400, netProfit: 5200 },
  ]);
  assert.deepEqual(
    { orders: series[0].orders, revenue: series[0].revenue, netProfit: series[0].netProfit },
    { orders: 7, revenue: 18400, netProfit: 5200 },
  );
});

test("order axis ticks are unique sensible whole numbers", () => {
  const ticks = buildOrderAxisTicks([0, 1, 2, 7]);
  assert.deepEqual(ticks, [...new Set(ticks)]);
  assert.ok(ticks.every(Number.isInteger));
  assert.equal(ticks[0], 0);
  assert.ok((ticks.at(-1) ?? 0) >= 7);
});

test("zero-only series produces a valid axis", () => {
  assert.deepEqual(buildOrderAxisTicks(Array(30).fill(0)), [0, 1]);
  assert.equal(completeAdminTrendSeries([emptyPoint("2026-08-30")], [])[0].orders, 0);
});

test("DZD and tooltip dates use readable chart formatting", () => {
  assert.match(formatAdminChartDzd(18400), /^18.+400 DZD$/);
  assert.match(formatAdminChartCompactDzd(18400), /DZD$/);
  assert.equal(formatAdminChartDate("2026-08-30"), "Aug 30");
});

test("all three tabs continue to drive the same Area data key", () => {
  const component = readFileSync(
    "src/app/[locale]/admin/components/AdminOverviewStats.tsx",
    "utf8",
  );
  assert.match(component, /\["orders", "revenue", "netProfit"\]/);
  assert.match(component, /dataKey=\{trendMetric\}/);
  assert.match(component, /setTrendMetric\(metric\)/);
});
