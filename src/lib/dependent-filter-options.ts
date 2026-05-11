import { CANONICAL_CATEGORIES, CANONICAL_DESIGNS, type SelectableItem } from "@/lib/categories-shared";

type FilterableProduct = {
  category?: string | null;
  designTheme?: string | null;
  status?: string | null;
};

export type FilterPill = {
  label: string;
  value: string;
};

type BuildDependentFilterPillsParams = {
  products: FilterableProduct[];
  categories?: SelectableItem[];
  designThemes?: SelectableItem[];
  selectedCategory: string;
  selectedDesign: string;
};

const ALL_PILL: FilterPill = { label: "All", value: "all" };

function normalizeFilterValue(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function capitalizeLabel(value: string | undefined | null): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isActiveProduct(product: FilterableProduct): boolean {
  return !product.status || product.status === "active";
}

function buildKnownOptionMap(items: SelectableItem[] | undefined, fallback: SelectableItem[]): Map<string, string> {
  const source = items && items.length > 0 ? items : fallback;
  const optionMap = new Map<string, string>();

  source.forEach((item) => {
    const value = normalizeFilterValue(item.slug);
    if (!value || optionMap.has(value)) return;
    optionMap.set(value, item.label ?? capitalizeLabel(item.slug));
  });

  return optionMap;
}

function pushKnownThenProductOptions(
  pills: FilterPill[],
  allowedValues: Set<string>,
  knownOptions: Map<string, string>,
  selectedValue: string,
) {
  knownOptions.forEach((label, value) => {
    if (allowedValues.has(value) || value === selectedValue) {
      pills.push({ label, value });
    }
  });

  const knownValues = new Set(knownOptions.keys());
  Array.from(allowedValues)
    .filter((value) => !knownValues.has(value))
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => pills.push({ label: capitalizeLabel(value), value }));
}

export function buildDependentFilterPills({
  products,
  categories,
  designThemes,
  selectedCategory,
  selectedDesign,
}: BuildDependentFilterPillsParams): { categoryPills: FilterPill[]; designPills: FilterPill[] } {
  const normalizedSelectedCategory = normalizeFilterValue(selectedCategory);
  const normalizedSelectedDesign = normalizeFilterValue(selectedDesign);
  const categoryOptions = buildKnownOptionMap(categories, CANONICAL_CATEGORIES);
  const designOptions = buildKnownOptionMap(designThemes, CANONICAL_DESIGNS);
  const categoryValues = new Set<string>();
  const designValues = new Set<string>();

  products.filter(isActiveProduct).forEach((product) => {
    const category = normalizeFilterValue(product.category);
    const design = normalizeFilterValue(product.designTheme) || "simple";
    if (!category || !design) return;

    if (normalizedSelectedDesign === "all" || design === normalizedSelectedDesign) {
      categoryValues.add(category);
    }

    if (normalizedSelectedCategory === "all" || category === normalizedSelectedCategory) {
      designValues.add(design);
    }
  });

  const categoryPills: FilterPill[] = [ALL_PILL];
  const designPills: FilterPill[] = [ALL_PILL];
  pushKnownThenProductOptions(categoryPills, categoryValues, categoryOptions, normalizedSelectedCategory);
  pushKnownThenProductOptions(designPills, designValues, designOptions, normalizedSelectedDesign);

  return { categoryPills, designPills };
}
