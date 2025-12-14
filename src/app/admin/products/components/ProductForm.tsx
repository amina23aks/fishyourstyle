"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import type { AdminProductCategory } from "@/lib/admin-products";
import type { SelectableOption } from "@/types/selectable";

export type ProductFormValues = {
  name: string;
  description: string;
  basePrice: string;
  discountPercent: string;
  category: AdminProductCategory;
  designTheme: string;
  designThemeCustom: string;
  stock: string;
  inStock: boolean;
  sizes: ("S" | "M" | "L" | "XL")[];
  colors: { id: string; labelFr: string; labelAr?: string; image?: string }[];
  gender?: "unisex" | "men" | "women" | "";
  images: string[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  heading: string;
  subheading?: string;
  submitLabel: string;
  initialValues?: Partial<ProductFormValues>;
  loading?: boolean;
  uploading?: boolean;
  cloudinaryConfigured: boolean;
  cloudinaryMissing: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
  onCancelEdit?: () => void;
  categories: SelectableOption[];
  designThemes: SelectableOption[];
  onCategoriesChange: (next: SelectableOption[]) => void;
  onDesignThemesChange: (next: SelectableOption[]) => void;
  onReloadCategories: () => Promise<void>;
  onReloadDesignThemes: () => Promise<void>;
};

const normalizeColors = (
  input: unknown,
  fallback: ProductFormValues["colors"],
): ProductFormValues["colors"] | null => {
  if (input === undefined || input === null) return null;
  if (Array.isArray(input)) {
    const normalized = input.reduce<ProductFormValues["colors"]>((acc, item) => {
      if (typeof item === "string") {
        acc.push({ id: item, labelFr: item, labelAr: item });
        return acc;
      }
      if (item && typeof item === "object") {
        const obj = item as { id?: unknown; labelFr?: unknown; labelAr?: unknown; image?: unknown; hex?: unknown };
        const id =
          (typeof obj.id === "string" && obj.id.trim()) ||
          (typeof obj.hex === "string" && obj.hex.trim()) ||
          null;
        if (!id) return acc;
        const labelFr = (typeof obj.labelFr === "string" && obj.labelFr.trim()) || id;
        const labelAr = typeof obj.labelAr === "string" && obj.labelAr.trim() ? obj.labelAr.trim() : undefined;
        const image = typeof obj.image === "string" && obj.image.trim() ? obj.image.trim() : undefined;
        acc.push({ id, labelFr, labelAr, image });
        return acc;
      }
      return acc;
    }, []);

    if (normalized.length > 0) return normalized;
    if (input.length === 0) return [];
    return fallback;
  }
  return fallback;
};

const normalizeImages = (images: unknown): string[] => {
  if (!Array.isArray(images)) return [];
  return Array.from(new Set(images.map(String).filter(Boolean)));
};

const defaultValues: ProductFormValues = {
  name: "",
  description: "",
  basePrice: "",
  discountPercent: "0",
  category: "hoodies",
  designTheme: "simple",
  designThemeCustom: "",
  stock: "",
  inStock: true,
  sizes: [],
  colors: [{ id: "#000000", labelFr: "#000000", labelAr: "#000000", image: "" }],
  gender: "",
  images: [],
};

const currencyFormatter = new Intl.NumberFormat("fr-DZ", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0,
});

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

const mergeSelectables = (
  base: { slug: string; name: string; isDefault?: boolean; id?: string }[],
  extra: { slug: string; name: string; isDefault?: boolean; id?: string }[],
) => {
  const map = new Map<string, { slug: string; name: string; isDefault?: boolean; id?: string }>();
  base.forEach((item) => map.set(item.slug, item));
  extra.forEach((item) => map.set(item.slug, { ...item, isDefault: map.get(item.slug)?.isDefault }));
  return Array.from(map.values());
};

function clampDiscount(value: number | null) {
  if (value === null || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 90) return 90;
  return value;
}

async function persistSelectable(name: string, type: "category" | "design") {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Unable to save entry");
  }
}

function getDiscountPreview(basePrice: number | null, discountPercent: number | null) {
  const base = Number.isFinite(basePrice ?? NaN) ? (basePrice as number) : null;
  const discount = clampDiscount(discountPercent);
  if (base === null) {
    return { label: "Enter a base price to preview", discountedPrice: null };
  }
  if (!discount) {
    return {
      label: `${currencyFormatter.format(base)} — no discount applied`,
      discountedPrice: base,
    };
  }
  const discounted = Math.max(base * (1 - discount / 100), 0);
  return {
    label: `${currencyFormatter.format(base)} → ${currencyFormatter.format(discounted)} (-${discount}%)`,
    discountedPrice: discounted,
  };
}

export function ProductForm({
  mode,
  heading,
  subheading,
  submitLabel,
  initialValues,
  loading,
  uploading,
  cloudinaryConfigured,
  cloudinaryMissing,
  onSubmit,
  onUploadImage,
  onCancelEdit,
  categories,
  designThemes,
  onCategoriesChange,
  onDesignThemesChange,
  onReloadCategories,
  onReloadDesignThemes,
}: ProductFormProps) {
  const initialColors = normalizeColors(initialValues?.colors, defaultValues.colors) ?? defaultValues.colors;
  const initialImages = normalizeImages(initialValues?.images ?? defaultValues.images);
  const [values, setValues] = useState<ProductFormValues>({
    ...defaultValues,
    ...initialValues,
    colors: initialColors,
    images: initialImages,
  });
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openColorIndex, setOpenColorIndex] = useState<number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const [designThemeOptions, setDesignThemeOptions] = useState<SelectableOption[]>(() => {
    const initial = initialValues?.designTheme
      ? [{ slug: initialValues.designTheme, name: capitalize(initialValues.designTheme) }]
      : [];
    return mergeSelectables(designThemes, initialValues?.designTheme ? initial : []);
  });
  const [isDeletingCategory, setIsDeletingCategory] = useState<string | null>(null);
  const [isDeletingDesign, setIsDeletingDesign] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    type: "category" | "design";
    item: SelectableOption;
  } | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newDesignName, setNewDesignName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewDesign, setShowNewDesign] = useState(false);

  const syncDesignThemes = useCallback(
    (next: SelectableOption[]) => {
      setDesignThemeOptions(next);
      onDesignThemesChange(next);
    },
    [onDesignThemesChange],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      ...initialValues,
      colors: normalizeColors(initialValues?.colors, prev.colors) ?? prev.colors,
      images: normalizeImages(initialValues?.images ?? prev.images),
    }));
  }, [initialValues]);

  useEffect(() => {
    if (openColorIndex !== null && typeof window !== "undefined") {
      const handler = (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        if (
          target?.closest?.("[data-color-popover]") ||
          ((target?.closest?.("[data-color-trigger]") as HTMLElement | null)?.dataset.index === `${openColorIndex}`)
        ) {
          return;
        }
        setOpenColorIndex(null);
        setAnchorRect(null);
      };

      document.addEventListener("mousedown", handler);
      return () => {
        document.removeEventListener("mousedown", handler);
      };
    }
  }, [openColorIndex]);

  useEffect(() => {
    if (!values.category && categories.length > 0) {
      setValues((prev) => ({ ...prev, category: prev.category || categories[0]?.slug || defaultValues.category }));
      return;
    }
    if (!categories.some((cat) => cat.slug === values.category)) {
      const fallback = categories[0]?.slug ?? defaultValues.category;
      setValues((prev) => ({ ...prev, category: fallback }));
    }
  }, [categories, values.category]);

  useEffect(() => {
    const initial = values.designTheme
      ? [{ slug: values.designTheme, name: capitalize(values.designTheme), isDefault: false }]
      : [];
    const merged = mergeSelectables(designThemes, initial);
    setDesignThemeOptions(merged);
    if (!merged.some((theme) => theme.slug === values.designTheme)) {
      setValues((prev) => ({ ...prev, designTheme: merged[0]?.slug ?? "simple" }));
    }
  }, [designThemes, values.designTheme]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const normalizedColors = values.colors
        .map((color) => {
          const id = color.id.trim();
          const labelFr = (color.labelFr || color.id).trim();
          const labelAr = color.labelAr?.trim();
          const image = color.image?.trim();

          const entry: ProductFormValues["colors"][number] = { id, labelFr };
          if (labelAr) entry.labelAr = labelAr;
          if (image) entry.image = image;
          return entry;
        })
        .filter((color) => color.id && color.labelFr);

      await onSubmit({ ...values, colors: normalizedColors });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save product";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (cloudinaryMissing) {
      setError("Cloudinary is not configured. Save without images or add config.");
      return;
    }

    setError(null);
    try {
      const imageUrl = await onUploadImage(file);
      setValues((prev) => ({ ...prev, images: normalizeImages([...prev.images, imageUrl]) }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image upload failed";
      setError(message);
    }
  };

  const computedSlug = useMemo(
    () =>
      values.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
    [values.name],
  );

  const preview = useMemo(() => {
    const base = Number(values.basePrice || "");
    const discount = Number(values.discountPercent || "");
    return getDiscountPreview(Number.isFinite(base) ? base : null, Number.isFinite(discount) ? discount : null);
  }, [values.basePrice, values.discountPercent]);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    const slug = slugify(trimmed);
    if (!slug) return;
    try {
      await persistSelectable(capitalize(trimmed), "category");
      const next = mergeSelectables(categories, [{ slug, name: capitalize(trimmed), id: slug, isDefault: false }]);
      onCategoriesChange(next);
      setValues((prev) => ({ ...prev, category: slug }));
      await onReloadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add category";
      console.error("Failed to add category", err);
      alert(message);
    } finally {
      setNewCategoryName("");
      setShowNewCategory(false);
    }
  };

  const performDeleteCategory = useCallback(
    async (category: SelectableOption) => {
      const slug = category.slug;
      setIsDeletingCategory(slug);
      try {
        const response = await fetch(`/api/categories?slug=${encodeURIComponent(slug)}&type=category`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to delete category");
        }
        const next = categories.filter((cat) => cat.slug !== slug);
        onCategoriesChange(next);
        setValues((prev) => ({
          ...prev,
          category: prev.category === slug ? next[0]?.slug ?? defaultValues.category : prev.category,
        }));
        await onReloadCategories();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete category";
        console.error("Failed to delete category", err);
        alert(message);
      } finally {
        setIsDeletingCategory(null);
      }
    },
    [categories, onCategoriesChange, onReloadCategories],
  );

  const performDeleteDesign = useCallback(
    async (design: SelectableOption) => {
      const slug = design.slug;
      setIsDeletingDesign(slug);
      try {
        const response = await fetch(`/api/categories?slug=${encodeURIComponent(slug)}&type=design`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to delete design");
        }
        const next = designThemeOptions.filter((theme) => theme.slug !== slug);
        syncDesignThemes(next);
        setValues((prev) => ({
          ...prev,
          designTheme: prev.designTheme === slug ? next[0]?.slug ?? "simple" : prev.designTheme,
        }));
        await onReloadDesignThemes();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete design";
        console.error("Failed to delete design", err);
        alert(message);
      } finally {
        setIsDeletingDesign(null);
      }
    },
    [designThemeOptions, onReloadDesignThemes, syncDesignThemes],
  );

  const requestDeleteCategory = useCallback((category: SelectableOption) => {
    if (category.isDefault) return;
    setPendingDelete({ type: "category", item: category });
  }, []);

  const requestDeleteDesign = useCallback((design: SelectableOption) => {
    if (design.isDefault) return;
    setPendingDelete({ type: "design", item: design });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.type === "category") {
        await performDeleteCategory(pendingDelete.item);
      } else {
        await performDeleteDesign(pendingDelete.item);
      }
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete, performDeleteCategory, performDeleteDesign]);

  const deletingSlug = isDeletingCategory ?? isDeletingDesign;

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200">{heading}</p>
          <h2 className="text-xl font-semibold text-white">{subheading ?? heading}</h2>
          <p className="max-w-3xl text-xs text-sky-100/80">
            Use the compact editor to create or update products. Unsaved image uploads stay local until you save.
          </p>
        </div>
        {mode === "edit" && onCancelEdit ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Product name</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Essential hoodie"
          />
          <span className="text-[11px] text-sky-100/70">Slug preview: {computedSlug || "—"}</span>
        </label>

        <label className="space-y-2 text-sm text-sky-100/90 md:col-span-2">
          <span className="font-semibold text-white">Description (optional)</span>
          <textarea
            value={values.description}
            onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
            placeholder="Enter product description..."
          />
        </label>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-sky-900/30">
          <label className="space-y-2 text-sm text-sky-100/90">
            <span className="font-semibold text-white">Base price (DZD)</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={values.basePrice}
              onChange={(e) => setValues((prev) => ({ ...prev, basePrice: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white shadow-inner shadow-sky-900/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="3200"
            />
          </label>
          <label className="space-y-2 text-sm text-sky-100/90">
            <span className="font-semibold text-white">Discount %</span>
            <input
              type="number"
              min="0"
              max="100"
              inputMode="decimal"
              value={values.discountPercent}
              onChange={(e) => setValues((prev) => ({ ...prev, discountPercent: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white shadow-inner shadow-sky-900/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="0"
            />
          </label>
          <div className="col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] text-sky-100/80">
            <span>Price after discount</span>
            <span className="font-semibold text-white text-right">{preview.label}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Category</span>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isSelected = values.category === cat.slug;
              const key = cat.id ? `cat-${cat.id}` : `default-${cat.slug}`;
              return (
                <div key={key} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setValues((prev) => ({ ...prev, category: cat.slug }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? "border-white bg-white text-slate-900"
                        : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                    }`}
                  >
                    {cat.name}
                  </button>
                  {!cat.isDefault ? (
                    <button
                      type="button"
                      onClick={() => requestDeleteCategory(cat)}
                      disabled={isDeletingCategory === cat.slug}
                      className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-rose-100 transition hover:bg-white/20 disabled:opacity-50"
                      aria-label={`Delete category ${cat.name}`}
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setShowNewCategory((prev) => !prev);
                setNewCategoryName("");
              }}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              + Add category
            </button>
          </div>
          {showNewCategory && (
            <div className="flex flex-wrap gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAddCategory();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void handleAddCategory()}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Add category
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Design theme</span>

          <div className="flex flex-wrap items-center gap-2">
            {designThemeOptions.map((theme) => {
              const active = values.designTheme === theme.slug;
              const key = theme.id ? `design-${theme.id}` : `default-${theme.slug}`;
              return (
                <div key={key} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        designTheme: theme.slug,
                      }))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-white bg-white text-slate-900"
                        : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                    }`}
                  >
                  {capitalize(theme.name)}
                </button>
                {!theme.isDefault ? (
                  <button
                    type="button"
                    onClick={() => requestDeleteDesign(theme)}
                    disabled={isDeletingDesign === theme.slug}
                    className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-rose-100 transition hover:bg-white/20 disabled:opacity-50"
                    aria-label={`Delete design ${theme.name}`}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            );
            })}
            <button
              type="button"
              onClick={() => {
                setShowNewDesign((prev) => !prev);
                setNewDesignName("");
              }}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              + Add design
            </button>
          </div>
          {showNewDesign && (
            <div className="flex flex-wrap gap-2">
              <input
                value={newDesignName}
                onChange={(e) => setNewDesignName(e.target.value)}
                placeholder="New design name"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = newDesignName.trim();
                    const slug = slugify(trimmed);
                    if (!slug) return;
                    try {
                      await persistSelectable(capitalize(trimmed), "design");
                      const next = mergeSelectables(designThemeOptions, [
                        { slug, name: capitalize(trimmed), id: slug, isDefault: false },
                      ]);
                      syncDesignThemes(next);
                      setValues((prev) => ({ ...prev, designTheme: slug, designThemeCustom: slug }));
                      await onReloadDesignThemes();
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Failed to add design";
                      console.error("Failed to add design", err);
                      alert(message);
                    }
                    setNewDesignName("");
                    setShowNewDesign(false);
                  }
                }}
              />
              <button
                type="button"
              onClick={async () => {
                const trimmed = newDesignName.trim();
                const slug = slugify(trimmed);
                if (!slug) return;
                try {
                  await persistSelectable(capitalize(trimmed), "design");
                  const next = mergeSelectables(designThemeOptions, [
                    { slug, name: capitalize(trimmed), id: slug, isDefault: false },
                  ]);
                  syncDesignThemes(next);
                  setValues((prev) => ({ ...prev, designTheme: slug, designThemeCustom: slug }));
                  await onReloadDesignThemes();
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Failed to add design";
                  console.error("Failed to add design", err);
                  alert(message);
                }
                  setNewDesignName("");
                  setShowNewDesign(false);
                }}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Add design
              </button>
            </div>
          )}
        </div>

        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Stock quantity</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={values.stock}
            onChange={(e) => setValues((prev) => ({ ...prev, stock: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="25"
          />
          <label className="flex items-center gap-2 text-xs text-sky-100/80">
            <input
              type="checkbox"
              checked={values.inStock}
              onChange={(e) => setValues((prev) => ({ ...prev, inStock: e.target.checked }))}
              className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-400 focus:ring-2 focus:ring-white/40"
            />
            Mark as available in stock
          </label>
        </label>

        <div className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Sizes</span>
          <div className="flex flex-wrap gap-2">
            {(["S", "M", "L", "XL"] as const).map((size) => {
              const checked = values.sizes.includes(size);
              return (
                <label
                  key={size}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    checked ? "border-white/60 bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/40 bg-white/5 text-emerald-400 focus:ring-2 focus:ring-white/40"
                    checked={checked}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        sizes: e.target.checked
                          ? [...prev.sizes, size]
                          : prev.sizes.filter((item) => item !== size),
                      }))
                    }
                  />
                  {size}
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 text-sm text-sky-100/90 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Colors</span>
            <button
              type="button"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
              onClick={() =>
                setValues((prev) => ({
                  ...prev,
                  colors: [
                    ...prev.colors,
                    { id: "#ffffff", labelFr: "#ffffff", labelAr: "#ffffff", image: "" },
                  ],
                }))
              }
            >
              + Add Color
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {values.colors.map((color, index) => {
              const hexValue = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.id)
                ? color.id
                : "#000000";
              return (
                <div key={`${color.id || "color"}-${index}`} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <button
                    type="button"
                    data-color-trigger
                    data-index={index}
                    onClick={(event) => {
                      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                      setAnchorRect(rect);
                      setOpenColorIndex(index);
                    }}
                    className="h-9 w-9 rounded-full border border-white/30 bg-white/10 p-0 ring-emerald-300 transition hover:border-white/50 focus-visible:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: hexValue }}
                    aria-label={`Pick color ${index + 1}`}
                  />
                  <input
                    type="text"
                    value={color.id}
                    onChange={(e) => {
                      const nextHex = e.target.value.trim();
                      setValues((prev) => {
                        const next = [...prev.colors];
                        next[index] = {
                          ...next[index],
                          id: nextHex,
                          labelFr: nextHex,
                          labelAr: nextHex,
                        };
                        return { ...prev, colors: next };
                      });
                    }}
                    className="w-28 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white shadow-inner shadow-sky-900/40 focus:border-white/40 focus:outline-none"
                    placeholder="#000000"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        colors:
                          prev.colors.filter((_, i) => i !== index) || [{ id: "#000000", labelFr: "#000000", labelAr: "#000000", image: "" }],
                      }))
                    }
                    className="text-[11px] text-rose-200 hover:text-rose-100"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {mounted && openColorIndex !== null && anchorRect
          ? createPortal(
              <div className="fixed inset-0 z-[120] pointer-events-none" data-color-popover>
                {(() => {
                  const popoverWidth = 260;
                  const spacing = 12;
                  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
                  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
                  const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
                  const preferredLeft = anchorRect.right + spacing;
                  let left = preferredLeft + popoverWidth > viewportWidth - 8
                    ? anchorRect.left - spacing - popoverWidth
                    : preferredLeft;
                  if (left < 8) {
                    left = Math.max(8, (viewportWidth - popoverWidth) / 2);
                  }
                  let top = anchorRect.top + scrollY;
                  const maxTop = scrollY + viewportHeight - 200;
                  if (top > maxTop) {
                    top = Math.max(scrollY + 8, maxTop - 12);
                  }

                  const color = values.colors[openColorIndex];
                  const hexValue = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.id)
                    ? color.id
                    : "#000000";

                  return (
                    <div
                      className="absolute pointer-events-auto rounded-xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl shadow-black/60"
                      style={{ left, top, width: popoverWidth }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={hexValue}
                          onChange={(e) =>
                            setValues((prev) => {
                              const next = [...prev.colors];
                              const nextHex = e.target.value;
                              next[openColorIndex] = {
                                ...next[openColorIndex],
                                id: nextHex,
                                labelFr: nextHex,
                                labelAr: nextHex,
                              };
                              return { ...prev, colors: next };
                            })
                          }
                          className="h-10 w-10 cursor-pointer rounded-lg border border-white/20 bg-white/10 p-0"
                          aria-label="Select color"
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-[11px] font-semibold text-white">HEX</label>
                          <input
                            type="text"
                            value={color.id}
                            onChange={(e) => {
                              const nextHex = e.target.value.trim();
                              setValues((prev) => {
                                const next = [...prev.colors];
                                next[openColorIndex] = {
                                  ...next[openColorIndex],
                                  id: nextHex,
                                  labelFr: nextHex,
                                  labelAr: nextHex,
                                };
                                return { ...prev, colors: next };
                              });
                            }}
                            className="w-full rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/40 focus:outline-none"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenColorIndex(null);
                            setAnchorRect(null);
                          }}
                          className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>,
              document.body,
            )
          : null}

        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Gender (optional)</span>
          <select
            value={values.gender}
            onChange={(e) => setValues((prev) => ({ ...prev, gender: e.target.value as ProductFormValues["gender"] }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="">Not set</option>
            <option value="unisex">Unisex</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </label>

        <div className="space-y-2 text-sm text-sky-100/90 md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Images</p>
            {cloudinaryMissing ? (
              <span className="text-[12px] text-amber-200">
                Cloudinary is not configured. You can still save products without images.
              </span>
            ) : null}
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-sky-900/30">
            <div className="flex flex-wrap gap-3">
              {values.images.length === 0 ? (
                <span className="text-xs text-sky-100/70">No images yet.</span>
              ) : (
                values.images.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/15">
                    <Image src={url} alt={`Product ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index),
                        }))
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white hover:bg-black/90"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <label
              className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white shadow shadow-sky-900/40 transition ${
                cloudinaryMissing ? "cursor-not-allowed bg-white/10 opacity-60" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={!cloudinaryConfigured}
              />
              {uploading ? "Uploading..." : "Upload image"}
            </label>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || uploading || isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-400/90 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/50 transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting || loading ? "Saving..." : submitLabel}
          </button>
          <span className="text-xs text-sky-100/70">
            Values accept commas for tags, sizes, and colors. Discounted price is preview-only until saved.
          </span>
        </div>
      </form>

      {mounted && pendingDelete
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal>
              <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-950/95 p-6 text-white shadow-2xl shadow-black/40">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Confirm delete</p>
                  <h3 className="text-lg font-semibold">
                    Delete {pendingDelete.type === "category" ? "category" : "design"} &quot;{pendingDelete.item.name}&quot;?
                  </h3>
                  <p className="text-sm text-sky-100/80">
                    This will remove it from all selectors. Products using it will fall back to the first available option.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={Boolean(deletingSlug)}
                    className="flex-1 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingSlug ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    disabled={Boolean(deletingSlug)}
                    className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    No, keep it
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

