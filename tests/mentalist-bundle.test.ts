import assert from "node:assert/strict";
import test from "node:test";
import { calculateCartPricing, calculateMentalistBundle, isMentalistCategory } from "../src/lib/mentalist-bundle";

test("prices Mentalist quantities in groups of three", () => {
  const expected = [0, 2900, 5400, 7500, 10400, 12900, 15000, 17900];
  expected.forEach((total, quantity) => assert.equal(calculateMentalistBundle(quantity).total, total));
});

test("counts mixed Mentalist designs and excludes other drops", () => {
  const totals = calculateCartPricing([
    { category: "The Mentalist", price: 999, quantity: 1 },
    { category: "the-mentalist", price: 4000, quantity: 2 },
    { category: "hoodies", price: 6000, quantity: 1 },
  ]);
  assert.deepEqual(totals.mentalist, { quantity: 3, subtotalBeforeDiscount: 8700, discount: 1200, total: 7500 });
  assert.equal(totals.subtotalBeforeDiscount, 14700);
  assert.equal(totals.subtotal, 13500);
  assert.equal(totals.bundleDiscount, 1200);
});

test("category matching is precise and resilient to display formatting", () => {
  assert.equal(isMentalistCategory(" The Mentalist "), true);
  assert.equal(isMentalistCategory("THE_MENTALIST"), true);
  assert.equal(isMentalistCategory("mentalist"), true);
  assert.equal(isMentalistCategory("mentalists"), false);
});
