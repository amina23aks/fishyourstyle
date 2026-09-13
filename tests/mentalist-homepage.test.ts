import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { calculateCartPricing, calculateMentalistBundle } from "../src/lib/mentalist-bundle";
import { normalizeShopFilterSettings } from "../src/lib/shop-filter-normalization";
import { selectFeaturedDropProducts, type StorefrontProduct } from "../src/lib/storefront-products";

const source = (path: string) => readFileSync(path, "utf8");
const storefrontProduct = (id: string, status: StorefrontProduct["status"], featuredDrops: string[], designTheme = "Simple") => ({
  id, slug: id, name: id, basePrice: 2_900, discountPercent: 0, finalPrice: 2_900,
  category: "tshirts", designTheme, sizes: [], colors: [], sizeGuideEnabled: false,
  inStock: true, images: { main: "", gallery: [] }, featuredDrops, status,
}) satisfies StorefrontProduct;

test("homepage configuration activates mentalist without deleting legacy flow data", () => {
  const settings = source("src/lib/home-settings.ts");
  assert.match(settings, /featuredDropSlug: "mentalist"/);
  assert.doesNotMatch(settings, /featuredDropSlug: "flow"/);

  const form = source("src/app/[locale]/admin/products/components/ProductForm.tsx");
  assert.match(form, /featuredDrops\.includes\("mentalist"\)/);
  assert.match(form, /filter\(\s*\(slug\) => slug !== "mentalist"/);
  assert.doesNotMatch(form, /filter\(\s*\(slug\) => slug !== "flow"/);
});

test("featured selection is explicit, active, deterministic, and max-limited", () => {
  const products = [
    storefrontProduct("z", "active", ["mentalist"]),
    storefrontProduct("a", "active", ["mentalist"]),
    storefrontProduct("hidden", "inactive", ["mentalist"]),
    storefrontProduct("theme-only", "active", [], "The Mentalist"),
    storefrontProduct("legacy", "active", ["flow"]),
  ];
  assert.deepEqual(selectFeaturedDropProducts(products, "mentalist", 1).map(({ id }) => id), ["a"]);
  assert.deepEqual(selectFeaturedDropProducts(products, "mentalist", 4).map(({ id }) => id), ["a", "z"]);
});

test("design theme and homepage membership remain independent", () => {
  const notFeatured = calculateCartPricing([{ design: "The Mentalist", price: 2_900, quantity: 2 }]);
  assert.equal(notFeatured.mentalist.total, 5_400);
  const unrelatedFeatured = calculateCartPricing([{ design: "Simple", price: 2_900, quantity: 2 }]);
  assert.equal(unrelatedFeatured.mentalist.quantity, 0);
});

test("promo derives all approved tiers from the shared pricing helper", () => {
  assert.deepEqual([1, 2, 3].map((quantity) => calculateMentalistBundle(quantity).total), [2_900, 5_400, 7_500]);
  const featuredSection = source("src/components/FeaturedDropSection.tsx");
  assert.match(featuredSection, /map\(calculateMentalistBundle\)/);
  assert.doesNotMatch(featuredSection, /5_400|7_500/);
});

test("featured section remains disableable and storefront prices remain canonical", () => {
  const home = source("src/app/[locale]/page.tsx");
  const adminSettings = source("src/app/[locale]/admin/settings/HomeSettingsForm.tsx");
  assert.match(home, /homeSettings\.showFeaturedDrop/);
  assert.match(adminSettings, /Show Featured Drop Section/);
  for (const path of ["src/app/[locale]/shop/product-card.tsx", "src/app/[locale]/shop/[slug]/product-detail-content.tsx"]) {
    assert.match(source(path), /product\.priceDzd/);
  }
});

test("new Firestore design themes are visible unless explicitly saved hidden", () => {
  const designs = [{ id: "the-mentalist", slug: "the-mentalist", label: "The Mentalist", isDefault: false }];
  assert.equal(normalizeShopFilterSettings(undefined, [], designs).designs["the-mentalist"].isVisibleOnShop, true);
  const hidden = normalizeShopFilterSettings({ designs: { "the-mentalist": { isVisibleOnShop: false } } }, [], designs);
  assert.equal(hidden.designs["the-mentalist"].isVisibleOnShop, false);
});

test("homepage sprint does not couple presentation to order costs", () => {
  const orderApi = source("src/app/api/orders/route.ts");
  assert.match(orderApi, /productData\?\.costPrice \?\? productData\?\.purchasePrice/);
  assert.match(orderApi, /netProfit = orderSubtotal - costOfGoodsSold/);
});
