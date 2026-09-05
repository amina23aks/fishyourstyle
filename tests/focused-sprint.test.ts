import assert from "node:assert/strict";
import test from "node:test";

import { filterPublicCollectionPills } from "../src/lib/filter-config";
import { filterHomepageProducts, HOMEPAGE_CATALOG_LIMIT } from "../src/lib/homepage-product-filter";
import { firstImageForProductColor, imagesForProductColor, normalizeImageColorAssignments } from "../src/lib/image-color-assignments";
import { normalizeShopFilterSettings } from "../src/lib/shop-filter-normalization";
import type { Product } from "../src/types/product";

const category = (slug: string, label: string) => ({ id: slug, slug, label, isDefault: false });
const product = (id: string, categoryName = "tshirts"): Product => ({
  id, slug: id, nameFr: id, nameAr: id, category: categoryName, kind: categoryName,
  fit: "regular", priceDzd: 1, currency: "DZD", gender: "", sizes: [], colors: ["#000000", "#00ff00"],
  images: { main: "main.jpg", gallery: ["black-1.jpg", "black-2.jpg"] },
  descriptionFr: "", descriptionAr: "", status: "active",
});

test("Firestore categories merge with saved settings and safe defaults", () => {
  const settings = normalizeShopFilterSettings({ categories: { tshirts: { label: "Tees", isVisibleOnShop: false, isComingSoon: true } } }, [category("tshirts", "T-shirts"), category("caps", "Caps")]);
  assert.deepEqual(settings.categories.tshirts, { label: "Tees", isVisibleOnShop: false, isComingSoon: true });
  assert.deepEqual(settings.categories.caps, { label: "Caps", isVisibleOnShop: true, isComingSoon: false });
});

test("saved categories are retained and visible/hidden pills are respected", () => {
  const settings = normalizeShopFilterSettings({ categories: { archived: { label: "Archive", isVisibleOnShop: true, isComingSoon: false } } }, [category("caps", "Caps")]);
  assert.ok(settings.categories.archived);
  settings.categories.caps.isVisibleOnShop = false;
  const pills = filterPublicCollectionPills([{ label: "All", value: "all" }, { label: "Caps", value: "caps" }, { label: "Archive", value: "archived" }], settings);
  assert.deepEqual(pills.map((pill) => pill.value), ["all", "archived"]);
});

test("homepage defaults to eight but filters against the bounded catalog", () => {
  const catalog = Array.from({ length: 12 }, (_, index) => product(String(index), index === 10 ? "caps" : "tshirts"));
  const preview = catalog.slice(0, 8);
  assert.equal(filterHomepageProducts(preview, catalog, {}).length, 8);
  assert.deepEqual(filterHomepageProducts(preview, catalog, { category: "caps" }).map((item) => item.id), ["10"]);
  assert.equal(HOMEPAGE_CATALOG_LIMIT, 48);
});

test("image assignments serialize cleanly and allow multiple images per color", () => {
  const assignments = normalizeImageColorAssignments([
    { image: "black-1.jpg", color: "#000000" },
    { image: "black-2.jpg", color: "#000000" },
  ], ["main.jpg", "black-1.jpg", "black-2.jpg"]);
  assert.equal(assignments.length, 2);
  assert.deepEqual(normalizeImageColorAssignments(JSON.parse(JSON.stringify(assignments))), assignments);
  const assigned = { ...product("assigned"), imageColorAssignments: assignments };
  assert.deepEqual(imagesForProductColor(assigned, "#000000"), ["black-1.jpg", "black-2.jpg"]);
  assert.equal(firstImageForProductColor(assigned, "#000000"), "black-1.jpg");
  assert.equal(firstImageForProductColor(assigned, "#00ff00"), "main.jpg");
});

test("old products and legacy color.image remain compatible", () => {
  assert.equal(firstImageForProductColor(product("old"), "#000000"), "main.jpg");
  const legacy = { ...product("legacy"), colors: [{ hex: "#000000", image: "legacy.jpg" }] };
  assert.equal(firstImageForProductColor(legacy, "#000000"), "legacy.jpg");
});
