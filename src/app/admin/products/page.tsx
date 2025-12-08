"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductForm, type ProductFormValues } from "./components/ProductForm";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  type AdminProduct,
} from "@/lib/admin-products";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

type Toast = { type: "success" | "error"; message: string };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(() => Date.now());

  const showToast = useCallback((payload: Toast) => {
    setToast(payload);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchProducts();
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

  const handleUploadImage = useCallback(async (file: File) => {
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
  }, [showToast]);

  const handleCreate = useCallback(
    async (values: ProductFormValues) => {
      setCreating(true);
      setError(null);
      try {
        const tags = values.tags
          ? values.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [];

        await createProduct({
          name: values.name.trim(),
          price: Number(values.price),
          stock: Number(values.stock),
          description: values.description?.trim() || undefined,
          category: values.category?.trim() || undefined,
          imageUrl: values.imageUrl || undefined,
          tags,
        });

        showToast({ type: "success", message: "Product created" });
        setFormKey(Date.now());
        loadProducts();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create product";
        setError(message);
        showToast({ type: "error", message });
      } finally {
        setCreating(false);
      }
    },
    [loadProducts, showToast],
  );

  const handleDelete = useCallback(
    async (productId: string) => {
      const confirmed = window.confirm("Delete this product? This cannot be undone.");
      if (!confirmed) return;

      try {
        await deleteProduct(productId);
        showToast({ type: "success", message: "Product deleted" });
        setProducts((prev) => prev.filter((product) => product.id !== productId));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete product";
        setError(message);
        showToast({ type: "error", message });
      }
    },
    [showToast],
  );

  const csvData = useMemo(() => {
    if (!products.length) return "";
    const headers = ["Name", "Price (DZD)", "Stock", "Category", "Image URL", "Tags"];
    const rows = products.map((product) => [
      product.name,
      product.price,
      product.stock,
      product.category ?? "",
      product.imageUrl ?? "",
      (product.tags ?? []).join("|") ?? "",
    ]);

    const escape = (value: unknown) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes("\"")) {
        return `"${str.replace(/\"/g, '""')}"`;
      }
      return str;
    };

    return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  }, [products]);

  const exportCsv = useCallback(() => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [csvData]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Products</p>
        <h1 className="text-3xl font-semibold text-white">Admin products</h1>
        <p className="max-w-2xl text-sky-100/85">
          Manage the product catalog in real-time: upload imagery to Cloudinary, keep Firestore in sync, and export the
          inventory list for reporting.
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
              <p className="text-xs text-sky-100/70">Inline edit and delete controls keep inventory tidy.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                disabled={!products.length}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
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
            <div className="grid grid-cols-6 gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-sky-100/70">
              <span className="col-span-2">Product</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Category</span>
              <span className="text-right">Actions</span>
            </div>
            {loading ? (
              <ProductTableSkeleton />
            ) : products.length === 0 ? (
              <div className="px-4 py-6 text-sm text-sky-100/80">No products yet. Add the first item using the form.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {products.map((product) => (
                  <li key={product.id} className="grid grid-cols-6 items-center gap-3 px-4 py-3 text-sm text-sky-50">
                    <div className="col-span-2 flex items-center gap-3">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
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
                        <p className="text-xs text-sky-100/70">{product.description ?? "No description"}</p>
                      </div>
                    </div>
                    <span>{new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(product.price)}</span>
                    <span>{product.stock} pcs</span>
                    <span className="truncate text-xs text-sky-100/80">{product.category ?? "-"}</span>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="rounded-full bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-50 transition hover:bg-rose-500/30"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-900/40">
          <ProductForm
            key={formKey}
            heading="Create"
            subheading="Add new product"
            submitLabel="Add product"
            loading={creating}
            uploading={uploadingImage}
            onSubmit={handleCreate}
            onUploadImage={handleUploadImage}
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
          <span className="block h-3 w-10 rounded-full bg-white/10" />
          <span className="block h-3 w-20 rounded-full bg-white/10" />
          <div className="flex justify-end gap-2">
            <span className="block h-8 w-14 rounded-full bg-white/10" />
            <span className="block h-8 w-14 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
