import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { calculateMentalistBundle } from "../src/lib/mentalist-bundle";

const shopClient = readFileSync("src/app/[locale]/shop/shop-client.tsx", "utf8");
const messages = (locale: "en" | "fr" | "ar") =>
  JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8")) as Record<string, string>;

test("Mentalist shop promo uses the existing translation hook instead of hardcoded copy", () => {
  for (const key of ["brand", "heading", "supportingLine", "saveLabel"]) {
    assert.match(shopClient, new RegExp(`t\\(.[^)]*shop\\.mentalistPromo\\.${key}`));
  }
  assert.match(shopClient, /t\(`shop\.mentalistPromo\.tier\$\{tier\.quantity\}Label`\)/);

  for (const removedCopy of [
    "Limited drop pricing",
    "The Mentalist Drop",
    "Mix any designs from this drop",
    "Discount applies automatically at checkout",
  ]) {
    assert.doesNotMatch(shopClient, new RegExp(removedCopy, "i"));
  }
});

test("Mentalist shop promo copy is complete in English, French, and Arabic", () => {
  const expected = {
    en: ["THE MENTALIST", "PICK YOUR PACK", "Mix any Mentalist designs.", "1 TEE", "2 TEES", "3 TEES", "SAVE"],
    fr: ["THE MENTALIST", "COMPOSE TON PACK", "Mixe les designs Mentalist de ton choix.", "1 T-SHIRT", "2 T-SHIRTS", "3 T-SHIRTS", "ÉCONOMISE"],
    ar: ["THE MENTALIST", "اختر باقتك", "اختر أي تصاميم من مجموعة Mentalist.", "1 تيشيرت", "2 تيشيرت", "3 تيشيرتات", "وفّر"],
  } as const;
  const keys = ["brand", "heading", "supportingLine", "tier1Label", "tier2Label", "tier3Label", "saveLabel"] as const;

  for (const locale of ["en", "fr", "ar"] as const) {
    const localeMessages = messages(locale);
    keys.forEach((key, index) => {
      assert.equal(localeMessages[`shop.mentalistPromo.${key}`], expected[locale][index]);
    });
  }
});

test("Mentalist promo remains theme-gated and derives canonical prices and savings", () => {
  assert.match(shopClient, /showMentalistPricing = isMentalistDesignTheme\(designFilter\)/);
  assert.match(shopClient, /\{showMentalistPricing \? \(/);
  assert.match(shopClient, /\[1, 2, 3\]\.map\(calculateMentalistBundle\)/);
  assert.doesNotMatch(shopClient, /5,400 DZD|7,500 DZD|SAVE 400 DZD|SAVE 1,200 DZD/);

  assert.deepEqual(
    [2, 3].map((quantity) => {
      const tier = calculateMentalistBundle(quantity);
      return { total: tier.total, discount: tier.discount };
    }),
    [
      { total: 5_400, discount: 400 },
      { total: 7_500, discount: 1_200 },
    ],
  );
});
