"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { ProductForm, type ProductFormValues } from "./components/ProductForm";
import {
  createAdminProduct,
  deleteAdminProduct,
  listAdminProducts,
  updateAdminProduct,
  type AdminProduct,
  type AdminProductInput,
} from "@/lib/admin-products";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { DEFAULT_CATEGORY_OPTIONS, DEFAULT_DESIGN_OPTIONS, type SelectableItem } from "@/lib/categories-shared";
import type { SelectableOption } from "@/types/selectable";

type Toast = { type: "success" | "error"; message: string };

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const cloudinaryConfigured = Boolean(cloudName && uploadPreset);
const cloudinaryMissing = !cloudName && !uploadPreset;
const toSelectableOption = (item: SelectableItem): SelectableOption => ({
  id: item.id,
  name: item.label,
  slug: item.slug,
  isDefault: item.isDefault,
});

const allowedSizes = ["S", "M", "L", "XL"] as const;
const builtInCategories: SelectableOption[] = DEFAULT_CATEGORY_OPTIONS.map(toSelectableOption);
const builtInDesignThemes: SelectableOption[] = DEFAULT_DESIGN_OPTIONS.map(toSelectableOption);

const deriveFromProducts = (products: AdminProduct[]) => {
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).map((slug) => ({
    id: slug,
    name: typeof slug === "string" ? slug : String(slug),
    label: typeof slug === "string" ? slug : String(slug),
    slug: typeof slug === "string" ? slug : String(slug),
    isDefault: DEFAULT_CATEGORY_OPTIONS.some((item) => item.slug === slug),
  }));

  const designs = Array.from(new Set(products.map((product) => product.designTheme).filter(Boolean))).map((slug) => ({
    id: slug,
    name: typeof slug === "string" ? slug : String(slug),
    label: typeof slug === "string" ? slug : String(slug),
    slug: typeof slug === "string" ? slug : String(slug),
    isDefault: DEFAULT_DESIGN_OPTIONS.some((item) => item.slug === slug),
  }));

  return { categories, designs };
};

const defaultForm: ProductFormValues = {
  name: "",
  description: "",
  basePrice: "",
  discountPercent: "0",
  category: "", // Will be set from categories list
  designTheme: "basic",
  designThemeCustom: "",
  stock: "",
  inStock: true,
  sizes: [],
  colors: [{ hex: "#000000" }],
  gender: "",
  images: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const mergeBySlug = (base: SelectableOption[], extra: SelectableOption[]) => {
  const map = new Map<string, SelectableOption>();
  base.forEach((item) => map.set(item.slug, item));
  extra.forEach((item) => map.set(item.slug, { ...item, isDefault: map.get(item.slug)?.isDefault }));
  return Array.from(map.values());
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<ProductFormValues>(defaultForm);
  const [formKey, setFormKey] = useState(() => Date.now());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<SelectableOption[]>(() => [...builtInCategories]);
  const [designThemes, setDesignThemes] = useState<SelectableOption[]>(() => [...builtInDesignThemes]);

  const coerceCollectionsAndDesigns = useCallback(
    (payload: { collections: SelectableItem[]; designs: SelectableItem[] }) => payload,
    [],
  );

  const showToast = useCallback((payload: Toast) => {
    setToast(payload);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadCollectionsAndDesigns = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = coerceCollectionsAndDesigns(await res.json());
      const derived = deriveFromProducts(products);
      setCategories(
        mergeBySlug(builtInCategories, [
          ...data.collections.map(toSelectableOption),
          ...derived.categories.map(toSelectableOption),
        ]),
      );
      setDesignThemes(
        mergeBySlug(builtInDesignThemes, [
          ...data.designs.map(toSelectableOption),
          ...derived.designs.map(toSelectableOption),
        ]),
      );
    } catch (err) {
      console.error("Failed to load categories and designs", err);
      const derived = deriveFromProducts(products);
      setCategories((prev) =>
        mergeBySlug(mergeBySlug(builtInCategories, derived.categories.map(toSelectableOption)), prev),
      );
      setDesignThemes((prev) =>
        mergeBySlug(mergeBySlug(builtInDesignThemes, derived.designs.map(toSelectableOption)), prev),
      );
    }
  }, [products]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?type=category");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const fetched = (await res.json()) as SelectableItem[];
      const derived = deriveFromProducts(products);
      setCategories(
        mergeBySlug(builtInCategories, [
          ...fetched.map(toSelectableOption),
          ...derived.categories.map(toSelectableOption),
        ]),
      );
    } catch (err) {
      console.error("Failed to load categories", err);
      const derived = deriveFromProducts(products);
      setCategories((prev) =>
        mergeBySlug(mergeBySlug(builtInCategories, derived.categories.map(toSelectableOption)), prev),
      );
    }
  }, [products]);

  const loadDesignThemes = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?type=design");
      if (!res.ok) throw new Error("Failed to fetch design themes");
      const fetched = (await res.json()) as SelectableItem[];
      const derived = deriveFromProducts(products);
      setDesignThemes(
        mergeBySlug(builtInDesignThemes, [
          ...fetched.map(toSelectableOption),
          ...derived.designs.map(toSelectableOption),
        ]),
      );
    } catch (err) {
      console.error("Failed to load design themes", err);
      const derived = deriveFromProducts(products);
      setDesignThemes((prev) =>
        mergeBySlug(mergeBySlug(builtInDesignThemes, derived.designs.map(toSelectableOption)), prev),
      );
    }
  }, [products]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAdminProducts();
      setProducts(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load products";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCollectionsAndDesigns();
  }, [loadCollectionsAndDesigns]);

  const handleUploadImage = useCallback(
    async (file: File) => {
      if (!cloudinaryConfigured) {
        throw new Error("Cloudinary is not configured. Save without an image or add credentials.");
      }

      setUploadingImage(true);
      setError(null);
      try {
        const url = await uploadImageToCloudinary(file);
        showToast({ type: "success", message: "Image uploaded to Cloudinary" });
        return url;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload image";
        showToast({ type: "error", message });
        throw err;
      } finally {
        setUploadingImage(false);
      }
    },
    [showToast],
  );

  const resetForm = useCallback(() => {
    setFormInitial(defaultForm);
    setFormKey(Date.now());
    setEditingId(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: ProductFormValues) => {
      setSaving(true);
      setError(null);
      const designTheme = values.designTheme || "basic";
      const payload: AdminProductInput = {
        name: values.name.trim(),
        slug: slugify(values.name),
        basePrice: Number(values.basePrice || 0),
        discountPercent: Number(values.discountPercent || 0),
        finalPrice: Math.max(Number(values.basePrice || 0) * (1 - Number(values.discountPercent || 0) / 100), 0),
        category: values.category,
        designTheme,
        sizes: values.sizes,
        colors: values.colors,
        stock: Number(values.stock || 0),
        images: values.images,
        inStock: values.inStock,
      };
      
      // Only include description if it's explicitly set (not empty string)
      if (values.description && values.description.trim() !== "") {
        payload.description = values.description.trim();
      }

      // Only include gender if it's explicitly set (not empty string)
      if (values.gender && values.gender.trim() !== "") {
        const genderValue = values.gender.trim().toLowerCase();
        if (genderValue === "unisex" || genderValue === "men" || genderValue === "women") {
          payload.gender = genderValue;
        }
      }

      try {
        if (editingId) {
          await updateAdminProduct(editingId, payload);
          showToast({ type: "success", message: "Product updated" });
        } else {
          await createAdminProduct(payload);
          showToast({ type: "success", message: "Product created" });
        }
        resetForm();
        loadProducts();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save product";
        setError(message);
        showToast({ type: "error", message });
      } finally {
        setSaving(false);
      }
    },
    [editingId, loadProducts, resetForm, showToast],
  );

  const handleDelete = useCallback(
    async (productId: string) => {
      const confirmed = window.confirm("Delete this product? This cannot be undone.");
      if (!confirmed) return;

      try {
        await deleteAdminProduct(productId);
        showToast({ type: "success", message: "Product deleted" });
        setProducts((prev) => prev.filter((product) => product.id !== productId));
        if (editingId === productId) {
          resetForm();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete product";
        setError(message);
        showToast({ type: "error", message });
      }
    },
    [editingId, resetForm, showToast],
  );

  const startEdit = useCallback((product: AdminProduct) => {
    setEditingId(product.id);
    
    setFormInitial({
      name: product.name,
      description: product.description ?? "",
      basePrice: product.basePrice?.toString() ?? "",
      discountPercent: product.discountPercent?.toString() ?? "0",
      category: product.category,
      designTheme: product.designTheme || "basic",
      designThemeCustom: "",
      stock: product.stock?.toString() ?? "",
      inStock: product.inStock,
      sizes: (product.sizes || [])
        .map((size) => size.toUpperCase())
        .filter((size): size is (typeof allowedSizes)[number] => allowedSizes.includes(size as (typeof allowedSizes)[number])),
      colors: product.colors,
      images: product.images,
      gender: product.gender ?? "",
    });
    setFormKey(Date.now());
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Products</p>
        <h1 className="text-3xl font-semibold text-white">Admin products</h1>
        <p className="max-w-2xl text-sky-100/85">
          Manage the catalog in real-time: upload imagery to Cloudinary, keep Firestore in sync, and export what you see.
        </p>
      </div>

      {toast ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-inner shadow-sky-900/30 ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-50"
              : "border-rose-500/50 bg-rose-500/10 text-rose-50"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-50 shadow-inner shadow-rose-900/30">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Current products</p>
              <p className="text-xs text-sky-100/70">Compact list with quick edit/delete.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadProducts}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-6 gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-100/70">
              <span className="col-span-2">Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>In stock?</span>
              <span className="text-right">Actions</span>
            </div>
            {loading ? (
              <ProductTableSkeleton />
            ) : products.length === 0 ? (
              <div className="px-4 py-6 text-sm text-sky-100/80">No products yet. Add the first item using the form.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {products.map((product) => {
                  const mainImage = product.images[0];
                  return (
                    <li key={product.id} className="grid grid-cols-6 items-center gap-3 px-4 py-3 text-sm text-sky-50">
                      <div className="col-span-2 flex items-center gap-3">
                        {mainImage ? (
                          <Image
                            src={mainImage}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/20"
                          />
                        ) : (
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-white/20 text-[11px] text-sky-100/70">
                            No image
                          </span>
                        )}
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{product.name}</p>
                          <p className="text-[11px] text-sky-100/70">{product.designTheme}</p>
                        </div>
                      </div>
                      <span className="text-xs uppercase text-sky-100/80">{product.category}</span>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-white">
                          {new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(
                            Math.max(product.finalPrice ?? product.basePrice, 0),
                          )}
                        </p>
                        {product.discountPercent > 0 ? (
                          <p className="text-[11px] text-sky-100/70">
                            Base{" "}
                            {new Intl.NumberFormat("fr-DZ", {
                              style: "currency",
                              currency: "DZD",
                              maximumFractionDigits: 0,
                            }).format(product.basePrice)}{" "}
                            • -{product.discountPercent}%
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>{product.stock} pcs</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            product.inStock
                              ? "bg-emerald-500/20 text-emerald-50 ring-1 ring-emerald-500/40"
                              : "bg-rose-500/15 text-rose-50 ring-1 ring-rose-500/40"
                          }`}
                        >
                          {product.inStock ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-full bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-50 transition hover:bg-rose-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-900/40">
          <ProductForm
            key={formKey}
            mode={editingId ? "edit" : "create"}
            heading="Create / Edit product"
            subheading={editingId ? "You are editing an existing product" : "Add a new product"}
            submitLabel={editingId ? "Save changes" : "Add product"}
            initialValues={formInitial}
            loading={saving}
            uploading={uploadingImage}
            cloudinaryConfigured={cloudinaryConfigured}
            cloudinaryMissing={cloudinaryMissing}
            onSubmit={handleSubmit}
            onUploadImage={handleUploadImage}
            onCancelEdit={resetForm}
            categories={categories}
            designThemes={designThemes}
            onCategoriesChange={setCategories}
            onDesignThemesChange={setDesignThemes}
            onReloadCategories={loadCategories}
            onReloadDesignThemes={loadDesignThemes}
          />
        </section>
      </div>
    </div>
  );
}

function ProductTableSkeleton() {
  return (
    <div className="divide-y divide-white/10">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="grid grid-cols-6 items-center gap-3 px-4 py-4 text-sm text-sky-100/70">
          <div className="col-span-2 flex items-center gap-3">
            <span className="h-12 w-12 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <span className="block h-3 w-32 rounded-full bg-white/10" />
              <span className="block h-3 w-40 rounded-full bg-white/10" />
            </div>
          </div>
          <span className="block h-3 w-16 rounded-full bg-white/10" />
          <span className="block h-3 w-20 rounded-full bg-white/10" />
          <span className="block h-3 w-10 rounded-full bg-white/10" />
          <div className="flex justify-end gap-2">
            <span className="block h-8 w-14 rounded-full bg-white/10" />
            <span className="block h-8 w-14 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
