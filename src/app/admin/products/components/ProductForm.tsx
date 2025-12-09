"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import type { AdminProductCategory } from "@/lib/admin-products";

export type ProductFormValues = {
  name: string;
  basePrice: string;
  discountPercent: string;
  category: AdminProductCategory;
  designTheme: string;
  designThemeCustom: string;
  stock: string;
  inStock: boolean;
  sizes: ("S" | "M" | "L" | "XL")[];
  colors: { hex: string }[];
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
};

const normalizeColors = (input: unknown): { hex: string }[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item === "string") return { hex: item };
        if (item && typeof item === "object" && "hex" in item) {
          return { hex: String((item as { hex: unknown }).hex) };
        }
        return null;
      })
      .filter((item): item is { hex: string } => Boolean(item?.hex));
  }
  return [];
};

const defaultValues: ProductFormValues = {
  name: "",
  basePrice: "",
  discountPercent: "0",
  category: "hoodies",
  designTheme: "basic",
  designThemeCustom: "",
  stock: "",
  inStock: true,
  sizes: [],
  colors: [{ hex: "#000000" }],
  gender: "",
  images: [],
};

const currencyFormatter = new Intl.NumberFormat("fr-DZ", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0,
});

function clampDiscount(value: number | null) {
  if (value === null || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 90) return 90;
  return value;
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
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    ...defaultValues,
    ...initialValues,
    colors: normalizeColors(initialValues?.colors ?? defaultValues.colors),
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      ...initialValues,
      colors: normalizeColors(initialValues?.colors ?? prev.colors),
    }));
  }, [initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
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
      setValues((prev) => ({ ...prev, images: [...prev.images, imageUrl] }));
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

  return (
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
          <div className="flex flex-wrap gap-2">
            {(["hoodies", "pants", "ensembles", "tshirts"] as const).map((cat) => {
              const active = values.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setValues((prev) => ({ ...prev, category: cat }))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active ? "border-white bg-white text-slate-900" : "border-white/20 bg-white/5 text-white/80"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Design theme</span>
          <div className="flex flex-wrap gap-2">
            {["basic", "cars", "anime", "nature", "custom"].map((theme) => {
              const active = values.designTheme === theme || (theme === "custom" && values.designTheme === "custom");
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      designTheme: theme === "custom" ? "custom" : theme,
                    }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active ? "border-white bg-white text-slate-900" : "border-white/20 bg-white/5 text-white/80"
                  }`}
                >
                  {theme === "custom" ? "Custom" : theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              );
            })}
          </div>
          {values.designTheme === "custom" ? (
            <input
              value={values.designThemeCustom}
              onChange={(e) => setValues((prev) => ({ ...prev, designThemeCustom: e.target.value }))}
              placeholder="Type your theme"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          ) : null}
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
              onClick={() => setValues((prev) => ({ ...prev, colors: [...prev.colors, { hex: "#ffffff" }] }))}
            >
              + Add Color
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {values.colors.map((color, index) => (
              <div key={index} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <input
                  type="color"
                  value={color.hex || "#000000"}
                  onChange={(e) =>
                    setValues((prev) => {
                      const next = [...prev.colors];
                      next[index] = { hex: e.target.value };
                      return { ...prev, colors: next };
                    })
                  }
                  className="h-9 w-9 cursor-pointer rounded-full border border-white/30 bg-white/10 p-0"
                />
                <span className="text-xs text-white/80">{color.hex}</span>
                <button
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      colors: prev.colors.filter((_, i) => i !== index) || [{ hex: "#000000" }],
                    }))
                  }
                  className="text-[11px] text-rose-200 hover:text-rose-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

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
                  <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/15">
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
  );
}

