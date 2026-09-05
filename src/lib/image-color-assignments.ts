import type { Product, ProductImageColorAssignment } from "@/types/product";

const normalize = (value: string | undefined) => (value ?? "").trim().toLowerCase();

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
