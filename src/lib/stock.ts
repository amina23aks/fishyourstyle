export type StockState = {
  stockMode: "unlimited" | "limited";
  stockQty: number;
  isAvailable: boolean;
};

type StockInput = {
  stockMode?: "unlimited" | "limited";
  stockQty?: number | null;
  inStock?: boolean;
  stock?: number;
  stockQuantity?: number;
};

export function normalizeProductStock(product: StockInput): StockState {
  const legacyQty =
    typeof product.stockQty === "number"
      ? product.stockQty
      : typeof product.stockQuantity === "number"
        ? product.stockQuantity
        : typeof product.stock === "number"
          ? product.stock
          : Number(product.stockQty ?? 0);
  const requestedMode =
    product.stockMode === "limited" || product.stockMode === "unlimited"
      ? product.stockMode
      : null;
  const derivedMode =
    requestedMode ??
    (product.inStock === false
      ? "limited"
      : typeof legacyQty === "number"
        ? "limited"
        : "unlimited");
  const stockQty =
    derivedMode === "limited" ? Math.max(Number(legacyQty ?? 0), 0) : 0;
  const isAvailable = derivedMode === "unlimited" ? true : stockQty > 0;

  return { stockMode: derivedMode, stockQty, isAvailable };
}
