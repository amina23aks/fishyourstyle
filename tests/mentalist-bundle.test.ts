import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateCartPricing,
  calculateMentalistBundle,
  isMentalistDesignTheme,
} from "../src/lib/mentalist-bundle";

test("matches only the canonical Mentalist design theme", () => {
  for (const value of ["The Mentalist", "the mentalist", "the-mentalist", " THE_MENTALIST "]) {
    assert.equal(isMentalistDesignTheme(value), true);
  }
  assert.equal(isMentalistDesignTheme("Simple"), false);
  assert.equal(isMentalistDesignTheme("Flow"), false);
  assert.equal(isMentalistDesignTheme("Tshirts"), false);
});

test("preserves the approved pack decomposition", () => {
  const expected = [0, 2_900, 5_400, 7_500, 10_400, 12_900, 15_000];
  expected.forEach((total, quantity) => assert.equal(calculateMentalistBundle(quantity).total, total));
});

test("combines mixed designs and quantities while excluding other Tshirts", () => {
  const totals = calculateCartPricing([
    { design: "The Mentalist", price: 2_900, quantity: 2 }, // two Tea variants/units
    { design: "the-mentalist", price: 2_900, quantity: 1 }, // Smile
    { design: "Simple", price: 3_200, quantity: 1 },
    { design: "Flow", price: 2_800, quantity: 1 },
  ]);
  assert.deepEqual(totals.mentalist, {
    quantity: 3,
    subtotalBeforeDiscount: 8_700,
    discount: 1_200,
    total: 7_500,
  });
  assert.equal(totals.subtotal, 13_500);
  assert.equal(totals.bundleDiscount, 1_200);
});

test("category cannot make a non-Mentalist design eligible", () => {
  const line = { category: "The Mentalist", design: "Simple", price: 2_900, quantity: 2 };
  const totals = calculateCartPricing([line]);
  assert.equal(totals.mentalist.quantity, 0);
  assert.equal(totals.subtotal, 5_800);
});

test("pricing is pure and does not alter design-specific cost data", () => {
  const products = [
    { design: "The Mentalist", price: 2_900, quantity: 1, costPrice: 1_610 },
    { design: "The Mentalist", price: 2_900, quantity: 1, costPrice: 1_870 },
  ];
  calculateCartPricing(products);
  assert.deepEqual(products.map((product) => product.costPrice), [1_610, 1_870]);
});

test("checkout authority uses Firestore designTheme and canonical price", () => {
  const source = readFileSync("src/app/api/orders/route.ts", "utf8");
  assert.match(source, /isMentalistDesignTheme\(productData\.designTheme\)/);
  assert.match(source, /design: productSnapshots\.get\(item\.id\)\?\.designTheme/);
  assert.match(source, /Math\.abs\(serverPrice - MENTALIST_UNIT_PRICE\)/);
  assert.doesNotMatch(source, /isMentalistCategory/);
});

test("storefront uses canonical stored prices without a Mentalist visual override", () => {
  for (const path of [
    "src/app/[locale]/shop/product-card.tsx",
    "src/app/[locale]/shop/[slug]/product-detail-content.tsx",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /product\.priceDzd/);
    assert.doesNotMatch(source, /MENTALIST_UNIT_PRICE|isMentalistDesignTheme|isMentalistCategory/);
  }
});
