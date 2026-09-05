export const PRODUCT_SIZES = ["TU", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export type ProductSize = (typeof PRODUCT_SIZES)[number];

export function isProductSize(value: string): value is ProductSize {
  return PRODUCT_SIZES.includes(value as ProductSize);
}
