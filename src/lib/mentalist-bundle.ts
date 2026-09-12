export const MENTALIST_UNIT_PRICE = 2_900;

export type MentalistBundleTotals = {
  quantity: number;
  subtotalBeforeDiscount: number;
  discount: number;
  total: number;
};

/** Matches the canonical Product.designTheme value and its normalized slug form. */
export function isMentalistDesignTheme(designTheme: unknown): boolean {
  if (typeof designTheme !== "string") return false;
  const normalized = designTheme.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized === "the-mentalist";
}

/** Prices complete groups of three first, then the one- or two-item remainder. */
export function calculateMentalistBundle(quantity: number): MentalistBundleTotals {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
  const packsOfThree = Math.floor(safeQuantity / 3);
  const remainder = safeQuantity % 3;
  const remainderTotal = remainder === 2 ? 5_400 : remainder === 1 ? MENTALIST_UNIT_PRICE : 0;
  const total = packsOfThree * 7_500 + remainderTotal;
  const subtotalBeforeDiscount = safeQuantity * MENTALIST_UNIT_PRICE;

  return {
    quantity: safeQuantity,
    subtotalBeforeDiscount,
    discount: subtotalBeforeDiscount - total,
    total,
  };
}

export type BundleCartLine = { design?: string; price: number; quantity: number };

export function calculateCartPricing(items: readonly BundleCartLine[]) {
  const mentalistQuantity = items.reduce(
    (sum, item) => sum + (isMentalistDesignTheme(item.design) ? Math.max(0, Math.floor(item.quantity)) : 0),
    0,
  );
  const mentalist = calculateMentalistBundle(mentalistQuantity);
  const regularSubtotal = items.reduce(
    (sum, item) => sum + (isMentalistDesignTheme(item.design) ? 0 : item.price * item.quantity),
    0,
  );

  return {
    subtotal: regularSubtotal + mentalist.total,
    subtotalBeforeDiscount: regularSubtotal + mentalist.subtotalBeforeDiscount,
    bundleDiscount: mentalist.discount,
    mentalist,
  };
}
