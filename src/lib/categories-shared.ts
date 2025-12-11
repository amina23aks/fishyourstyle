export type SelectableItem = {
  /**
   * Stable identifier used for slugs and Firestore document IDs.
   * This is returned even when Firestore is unavailable so UI pills stay consistent.
   */
  id: string;
  /** Human-friendly label shown in the UI. */
  label: string;
  /** Deterministic slug (alias for `id`) for filters and product association. */
  slug: string;
  /** Whether the entry is protected from deletion. */
  isDefault: boolean;
};

export const DEFAULT_CATEGORIES: SelectableItem[] = [
  { id: "hoodies", label: "Hoodies", slug: "hoodies", isDefault: true },
  { id: "pants", label: "Pants", slug: "pants", isDefault: true },
  { id: "ensembles", label: "Ensembles", slug: "ensembles", isDefault: true },
  { id: "tshirts", label: "Tshirts", slug: "tshirts", isDefault: true },
];

export const DEFAULT_DESIGNS: SelectableItem[] = [
  { id: "basic", label: "Basic", slug: "basic", isDefault: true },
  { id: "cars", label: "Cars", slug: "cars", isDefault: true },
  { id: "anime", label: "Anime", slug: "anime", isDefault: true },
  { id: "nature", label: "Nature", slug: "nature", isDefault: true },
  { id: "harry-potter", label: "Harry Potter", slug: "harry-potter", isDefault: true },
];

export const DEFAULT_KEYS = new Set([...DEFAULT_CATEGORIES, ...DEFAULT_DESIGNS].map((item) => item.slug));
export const DEFAULT_CATEGORY_OPTIONS = DEFAULT_CATEGORIES;
export const DEFAULT_DESIGN_OPTIONS = DEFAULT_DESIGNS;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function mergeWithDefaults(defaults: SelectableItem[], fetched: SelectableItem[]): SelectableItem[] {
  const merged = new Map<string, SelectableItem>();

  defaults.forEach((item) => merged.set(item.slug, item));
  fetched.forEach((item) => {
    const slug = item.slug || item.id;
    const isDefault = merged.get(slug)?.isDefault ?? DEFAULT_KEYS.has(slug);
    merged.set(slug, { ...item, id: slug, slug, isDefault });
  });

  return Array.from(merged.values()).sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.label.localeCompare(b.label);
  });
}
