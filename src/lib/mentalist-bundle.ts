export const MENTALIST_UNIT_PRICE = 2_900;

export type MentalistBundleTotals = {
  quantity: number;
  subtotalBeforeDiscount: number;
  discount: number;
  total: number;
};

/** Accepts the human label and the common slug forms used by category records. */
export function isMentalistCategory(category: unknown): boolean {
  if (typeof category !== "string") return false;
  const normalized = category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized === "the-mentalist" || normalized === "mentalist";
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

export type BundleCartLine = { category?: string; price: number; quantity: number };

export function calculateCartPricing(items: readonly BundleCartLine[]) {
  const mentalistQuantity = items.reduce(
    (sum, item) => sum + (isMentalistCategory(item.category) ? Math.max(0, Math.floor(item.quantity)) : 0),
    0,
  );
  const mentalist = calculateMentalistBundle(mentalistQuantity);
  const regularSubtotal = items.reduce(
    (sum, item) => sum + (isMentalistCategory(item.category) ? 0 : item.price * item.quantity),
    0,
  );

  return {
    subtotal: regularSubtotal + mentalist.total,
    subtotalBeforeDiscount: regularSubtotal + mentalist.subtotalBeforeDiscount,
    bundleDiscount: mentalist.discount,
    mentalist,
  };
}
