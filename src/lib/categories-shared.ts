export type SelectableItem = {
  /** Stable identifier used for slugs and Firestore document IDs. */
  id: string;
  /** Human-friendly label shown in the UI. */
  label: string;
  /** Deterministic slug (alias for `id`) for filters and product association. */
  slug: string;
  /** Whether the entry is part of the canonical seed set. */
  isDefault: boolean;
};

export const CANONICAL_CATEGORY_SLUGS = ["hoodies", "pants", "ensembles", "tshirts", "sweatshirts"] as const;

export const CANONICAL_DESIGN_SLUGS = ["simple"] as const;

export const CANONICAL_CATEGORIES: SelectableItem[] = CANONICAL_CATEGORY_SLUGS.map((slug) => ({
  id: slug,
  slug,
  label: slug.charAt(0).toUpperCase() + slug.slice(1),
  isDefault: true,
}));

export const CANONICAL_DESIGNS: SelectableItem[] = [
  { id: "simple", label: "Simple", slug: "simple", isDefault: true },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
