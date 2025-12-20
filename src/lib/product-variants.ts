import { Product, type ProductColor, type ProductColorOption, type ProductSizeOption } from "@/types/product";

const swatchHexMap: Record<string, string> = {
  noir: "#1f2937",
  black: "#111827",
  blanc: "#f9fafb",
  white: "#f9fafb",
  gris: "#9ca3af",
  gray: "#9ca3af",
  rouge: "#dc2626",
  red: "#ef4444",
  bleu: "#2563eb",
  blue: "#2563eb",
  vert: "#16a34a",
  green: "#22c55e",
  beige: "#d6c9a5",
  beigeclair: "#e5d5b5",
};

const normalizeHexValue = (value: string | undefined): string => (value ?? "").trim().toLowerCase();

const toProductColorOption = (
  color: ProductColor,
): (Omit<ProductColorOption, "soldOut"> & { soldOut?: boolean }) | null => {
  if (typeof color === "string") {
    return { hex: color, label: color };
  }

  if ("hex" in color) {
    const hex = typeof color.hex === "string" ? color.hex : "";
    if (!hex) return null;
    const label = typeof color.labelFr === "string" ? color.labelFr : hex;
    const image = typeof color.image === "string" ? color.image : undefined;
    const soldOut = "soldOut" in color ? Boolean(color.soldOut) : undefined;
    return { hex, label, image, soldOut };
  }

  const id = typeof color.id === "string" ? color.id : "";
  if (!id) return null;
  const label = typeof color.labelFr === "string" ? color.labelFr : id;
  const image = typeof color.image === "string" ? color.image : undefined;
  const soldOut = "soldOut" in color ? Boolean(color.soldOut) : undefined;
  return { hex: id, label, image, soldOut };
};

export const resolveSwatchHex = (color: ProductColorOption): string => {
  if (color.hex && /^#([0-9A-F]{3}){1,2}$/i.test(color.hex)) {
    return color.hex;
  }
  const label = color.label?.toLowerCase().replace(/\s+/g, "") ?? "";
  return swatchHexMap[label] ?? color.hex ?? "#e5e7eb";
};

export const buildProductColorOptions = (product: Product): ProductColorOption[] => {
  const soldOutSet = new Set((product.soldOutColorCodes ?? []).map((hex) => normalizeHexValue(hex)));

  return product.colors.reduce<ProductColorOption[]>((acc, color) => {
    const base = toProductColorOption(color);
    if (!base || !base.hex) return acc;

    const soldOut = soldOutSet.has(normalizeHexValue(base.hex)) || Boolean(base.soldOut);
    acc.push({ ...base, soldOut });
    return acc;
  }, []);
};

export const buildProductSizeOptions = (product: Product): ProductSizeOption[] => {
  const soldOutSet = new Set((product.soldOutSizes ?? []).map((size) => size.toUpperCase()));

  return product.sizes.map((size) => ({
    value: size,
    soldOut: soldOutSet.has(size.toUpperCase()),
  }));
};

export const hasAvailableVariants = (product: Product): boolean => {
  const colors = buildProductColorOptions(product);
  const sizes = buildProductSizeOptions(product);

  const hasColorOptions = colors.length > 0;
  const hasSizeOptions = sizes.length > 0;

  const hasAvailableColor = colors.some((color) => !color.soldOut) || !hasColorOptions;
  const hasAvailableSize = sizes.some((size) => !size.soldOut) || !hasSizeOptions;

  return hasAvailableColor && hasAvailableSize;
};

export { normalizeHexValue };
