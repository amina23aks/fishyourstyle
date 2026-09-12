import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ALGERIA_WILAYAS, normalizeWilaya } from "../src/data/algeriaWilayas";
import { calculateCartPricing } from "../src/lib/mentalist-bundle";
import { allocateOrderLineRevenue, calculateDeliveredAccounting } from "../src/lib/order-accounting";
import { getEconomicShippingByWilaya } from "../src/data/shipping";

const source = (path: string) => readFileSync(path, "utf8");

test("discounted merchandise revenue reconciles with COGS and excludes shipping", () => {
  const pricing = calculateCartPricing([{ design: "The Mentalist", price: 2_900, quantity: 3 }]);
  assert.deepEqual(pricing.mentalist, { quantity: 3, subtotalBeforeDiscount: 8_700, discount: 1_200, total: 7_500 });
  const accounting = calculateDeliveredAccounting({ subtotal: pricing.subtotal, costOfGoodsSold: 5_320 });
  assert.deepEqual(accounting, { revenue: 7_500, costOfGoodsSold: 5_320, netProfit: 2_180 });
  assert.equal(pricing.subtotal + 1_350, 8_850);
  assert.notEqual(accounting.netProfit, 3_380);
});

test("integer line allocation is exact and only discounts Mentalist lines", () => {
  const lines = allocateOrderLineRevenue([
    { design: "The Mentalist", price: 2_900, quantity: 1, itemCostPrice: 1_700 },
    { design: "The Mentalist", price: 2_900, quantity: 1, itemCostPrice: 1_810 },
    { design: "The Mentalist", price: 2_900, quantity: 1, itemCostPrice: 1_810 },
    { design: "Simple", price: 3_200, quantity: 1, itemCostPrice: 2_000 },
  ], 7_500);
  assert.deepEqual(lines.map(({ allocatedRevenue }) => allocatedRevenue), [2_500, 2_500, 2_500, 3_200]);
  assert.equal(lines.slice(0, 3).reduce((sum, line) => sum + line.allocatedRevenue, 0), 7_500);
  assert.equal(lines.slice(0, 3).reduce((sum, line) => sum + line.contribution, 0), 2_180);
  assert.equal(lines[3].contribution, 1_200);
});

test("return adjustment keeps established accounting semantics", () => {
  assert.equal(calculateDeliveredAccounting({ subtotal: 7_500, costOfGoodsSold: 5_320, returnCost: 300 }).netProfit, 1_880);
  const overview = source("src/app/[locale]/admin/components/AdminOverviewStats.tsx");
  assert.match(overview, /subtotal: finalSubtotal/);
  assert.doesNotMatch(overview, /estimatedLineProfit/);
});

test("visible summaries omit only the redundant Final drop total row", () => {
  for (const path of [
    "src/app/[locale]/checkout/CheckoutClient.tsx",
    "src/components/cart/cart-drawer.tsx",
    "src/app/[locale]/cart/page.tsx",
    "src/app/[locale]/orders/[id]/page.tsx",
    "src/app/[locale]/admin/orders/[id]/page.tsx",
  ]) assert.doesNotMatch(source(path), /Final drop total/);
  assert.match(source("src/types/order.ts"), /mentalistDropTotal\?: number/);
});

test("mobile Wilaya controls select canonical values without a native datalist", () => {
  const canonical = ALGERIA_WILAYAS[15].label;
  const normalized = normalizeWilaya(canonical);
  assert.equal(normalized, ALGERIA_WILAYAS[15].name);
  assert.ok(normalized && getEconomicShippingByWilaya(normalized));
  const mobile = source("src/components/MobileWilayaSelect.tsx");
  assert.match(mobile, /onSelect\(wilaya\.label\)/);
  assert.match(mobile, /role="listbox"/);
  assert.doesNotMatch(mobile, /datalist|list=/);
  for (const path of ["src/app/[locale]/checkout/CheckoutClient.tsx", "src/components/cart/cart-drawer.tsx"]) {
    assert.match(source(path), /MobileWilayaSelect/);
    assert.match(source(path), /md:block/);
  }
});
