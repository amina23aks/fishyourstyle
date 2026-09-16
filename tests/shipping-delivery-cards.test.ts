import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getEconomicShippingByWilaya } from "../src/data/shipping";

const source = (path: string) => readFileSync(path, "utf8");

test("canonical shipping quotes expose distinct HOME and DESK prices across Wilayas", () => {
  assert.deepEqual(getEconomicShippingByWilaya("Alger"), {
    wilaya: "Alger",
    home: 400,
    desk: 400,
  });
  assert.deepEqual(getEconomicShippingByWilaya("Ghardaïa"), {
    wilaya: "Ghardaïa",
    home: 850,
    desk: 550,
  });
  assert.deepEqual(getEconomicShippingByWilaya("Naâma"), {
    wilaya: "Naâma",
    home: 1350,
    desk: 900,
  });
  assert.deepEqual(getEconomicShippingByWilaya("Tamanrasset"), {
    wilaya: "Tamanrasset",
    home: 1550,
    desk: 1300,
  });
});

test("full and quick checkout render both prices through the shared delivery cards", () => {
  const cards = source("src/components/DeliveryModeCards.tsx");
  assert.match(cards, /price: quote\?\.home/);
  assert.match(cards, /price: quote\?\.desk/);
  assert.match(cards, /formatShippingPrice\(price\)/);

  for (const path of [
    "src/app/[locale]/checkout/CheckoutClient.tsx",
    "src/components/cart/cart-drawer.tsx",
  ]) {
    const checkout = source(path);
    assert.match(checkout, /getEconomicShippingByWilaya\(form\.wilaya\)/);
    assert.match(checkout, /<DeliveryModeCards/);
    assert.match(checkout, /quote=\{shippingQuote \?\? undefined\}/);
    assert.match(checkout, /deliveryMode === "home" \? shippingQuote\.home : shippingQuote\.desk/);
  }
});

test("delivery cards do not duplicate or hardcode shipping rates", () => {
  const cards = source("src/components/DeliveryModeCards.tsx");
  assert.doesNotMatch(cards, /ECONOMIC_SHIPPING/);
  assert.doesNotMatch(cards, /\b(?:400|550|850|900|1300|1350|1500|1550)\b/);
});
