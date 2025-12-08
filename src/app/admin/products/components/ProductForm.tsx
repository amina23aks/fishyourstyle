"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type ProductFormValues = {
  name: string;
  price: number;
  description: string;
  stock: number;
  category: string;
  tags: string;
  imageUrl: string;
};

type ProductFormProps = {
  heading: string;
  subheading?: string;
  submitLabel: string;
  initialValues?: Partial<ProductFormValues>;
  loading?: boolean;
  uploading?: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
};

export function ProductForm({
  heading,
  subheading,
  submitLabel,
  initialValues,
  loading,
  uploading,
  onSubmit,
  onUploadImage,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    price: 0,
    description: "",
    stock: 0,
    category: "",
    tags: "",
    imageUrl: "",
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues((prev) => ({ ...prev, ...initialValues }));
  }, [initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...values,
        price: Number(values.price),
        stock: Number(values.stock),
      });
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

    setError(null);
    try {
      const imageUrl = await onUploadImage(file);
      setValues((prev) => ({ ...prev, imageUrl }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image upload failed";
      setError(message);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">{heading}</p>
        <h2 className="text-2xl font-semibold text-white">{subheading ?? heading}</h2>
        <p className="max-w-2xl text-sm text-sky-100/80">
          Add product details, upload imagery to Cloudinary, and manage categories or tags for better catalog organization.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Product name</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Hoodie Regular"
          />
        </label>

        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Price (DZD)</span>
          <input
            required
            type="number"
            min="0"
            value={values.price}
            onChange={(e) => setValues((prev) => ({ ...prev, price: Number(e.target.value) }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="3200"
          />
        </label>

        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Stock quantity</span>
          <input
            required
            type="number"
            min="0"
            value={values.stock}
            onChange={(e) => setValues((prev) => ({ ...prev, stock: Number(e.target.value) }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="25"
          />
        </label>

        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Category</span>
          <input
            value={values.category}
            onChange={(e) => setValues((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="hoodies, pants, accessories"
          />
        </label>

        <label className="space-y-2 text-sm text-sky-100/90 md:col-span-2">
          <span className="font-semibold text-white">Description</span>
          <textarea
            value={values.description}
            onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Add a short description for this product"
          />
        </label>

        <label className="space-y-2 text-sm text-sky-100/90">
          <span className="font-semibold text-white">Tags (comma separated)</span>
          <input
            value={values.tags}
            onChange={(e) => setValues((prev) => ({ ...prev, tags: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="winter, best-seller"
          />
        </label>

        <div className="space-y-2 text-sm text-sky-100/90">
          <p className="font-semibold text-white">Product image</p>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-sky-900/30">
            {values.imageUrl ? (
              <Image
                src={values.imageUrl}
                alt={values.name || "Product"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/20"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-sky-100/70">
                No image
              </span>
            )}
            <div className="flex flex-1 flex-col gap-2 text-xs text-sky-100/80">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow shadow-sky-900/40 transition hover:bg-white/15">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {uploading ? "Uploading..." : "Upload image"}
              </label>
              {values.imageUrl ? <span className="truncate text-[11px] text-sky-100/70">{values.imageUrl}</span> : null}
            </div>
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
        <span className="text-sm text-sky-100/70">
          Cloudinary uploads are automatic. The returned image URL will be stored alongside product details in Firestore.
        </span>
      </div>
    </form>
  );
}
