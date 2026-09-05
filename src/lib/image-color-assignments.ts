import type { Product, ProductImageColorAssignment } from "@/types/product";

const normalize = (value: string | undefined) => (value ?? "").trim().toLowerCase();

export function allProductImages(product: Product): string[] {
  const images = Array.from(new Set([
    product.images.main,
    ...(product.images.gallery ?? []),
    ...product.colors.flatMap((entry) =>
      typeof entry !== "string" && entry.image ? [entry.image] : [],
    ),
  ].filter(Boolean)));
  return images.length ? images : ["/placeholder.png"];
}

export function normalizeImageColorAssignments(
  value: unknown,
  validImages?: string[],
): ProductImageColorAssignment[] {
  if (!Array.isArray(value)) return [];
  const allowed = validImages ? new Set(validImages.filter(Boolean)) : null;
  const seen = new Set<string>();
  return value.reduce<ProductImageColorAssignment[]>((result, entry) => {
    if (!entry || typeof entry !== "object") return result;
    const data = entry as { image?: unknown; color?: unknown };
    const image = typeof data.image === "string" ? data.image.trim() : "";
    const color = typeof data.color === "string" ? data.color.trim() : "";
    const key = `${image}\u0000${normalize(color)}`;
    if (!image || !color || (allowed && !allowed.has(image)) || seen.has(key)) return result;
    seen.add(key);
    result.push({ image, color });
    return result;
  }, []);
}

export function imagesForProductColor(product: Product, color: string): string[] {
  const allImages = Array.from(
    new Set([product.images.main, ...(product.images.gallery ?? [])].filter(Boolean)),
  );
  const target = normalize(color);
  const assigned = normalizeImageColorAssignments(product.imageColorAssignments, allImages)
    .filter((entry) => normalize(entry.color) === target)
    .map((entry) => entry.image);

  if (assigned.length > 0) return assigned;

  // Legacy color.image remains a compatibility fallback, but no relationship is invented.
  const legacy = product.colors.find((entry) => {
    if (typeof entry === "string") return false;
    const identifier = "hex" in entry ? entry.hex : entry.id;
    return normalize(identifier) === target && typeof entry.image === "string" && entry.image;
  });
  if (legacy && typeof legacy !== "string" && legacy.image) return [legacy.image];
  return product.images.main ? [product.images.main] : allImages;
}

export function firstImageForProductColor(product: Product, color: string): string {
  return imagesForProductColor(product, color)[0] || product.images.main || "/placeholder.png";
}

export function productCardImagesForColor(
  product: Product,
  color?: string,
): { base: string; hover?: string } {
  const all = allProductImages(product);
  const matching = color ? imagesForProductColor(product, color) : [];
  const base = matching[0] || all[0] || "/placeholder.png";
  const hover = matching.find((image) => image !== base) ?? all.find((image) => image !== base);
  return { base, hover };
}

export function galleryIndexForColor(product: Product, color: string): number {
  const index = allProductImages(product).indexOf(firstImageForProductColor(product, color));
  return index >= 0 ? index : 0;
}
