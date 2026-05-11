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
};

type IsDesignFilterAvailableForCategoryParams = {
  products: FilterableProduct[];
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

function pushAllKnownOptions(pills: FilterPill[], knownOptions: Map<string, string>) {
  knownOptions.forEach((label, value) => {
    pills.push({ label, value });
  });
}

function pushKnownThenProductOptions(
  pills: FilterPill[],
  allowedValues: Set<string>,
  knownOptions: Map<string, string>,
) {
  knownOptions.forEach((label, value) => {
    if (allowedValues.has(value)) {
      pills.push({ label, value });
    }
  });

  const knownValues = new Set(knownOptions.keys());
  Array.from(allowedValues)
    .filter((value) => !knownValues.has(value))
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => pills.push({ label: capitalizeLabel(value), value }));
}

export function isDesignFilterAvailableForCategory({
  products,
  selectedCategory,
  selectedDesign,
}: IsDesignFilterAvailableForCategoryParams): boolean {
  const normalizedSelectedDesign = normalizeFilterValue(selectedDesign);
  if (normalizedSelectedDesign === "all") return true;

  const normalizedSelectedCategory = normalizeFilterValue(selectedCategory);

  return products.filter(isActiveProduct).some((product) => {
    const category = normalizeFilterValue(product.category);
    const design = normalizeFilterValue(product.designTheme) || "simple";
    if (!category || !design) return false;
    if (normalizedSelectedCategory !== "all" && category !== normalizedSelectedCategory) return false;
    return design === normalizedSelectedDesign;
  });
}

export function buildDependentFilterPills({
  products,
  categories,
  designThemes,
  selectedCategory,
}: BuildDependentFilterPillsParams): { categoryPills: FilterPill[]; designPills: FilterPill[] } {
  const normalizedSelectedCategory = normalizeFilterValue(selectedCategory);
  const categoryOptions = buildKnownOptionMap(categories, CANONICAL_CATEGORIES);
  const designOptions = buildKnownOptionMap(designThemes, CANONICAL_DESIGNS);
  const designValues = new Set<string>();

  products.filter(isActiveProduct).forEach((product) => {
    const category = normalizeFilterValue(product.category);
    const design = normalizeFilterValue(product.designTheme) || "simple";
    if (!category || !design) return;

    if (normalizedSelectedCategory === "all" || category === normalizedSelectedCategory) {
      designValues.add(design);
    }
  });

  const categoryPills: FilterPill[] = [ALL_PILL];
  const designPills: FilterPill[] = [ALL_PILL];
  pushAllKnownOptions(categoryPills, categoryOptions);
  pushKnownThenProductOptions(designPills, designValues, designOptions);

  return { categoryPills, designPills };
}
