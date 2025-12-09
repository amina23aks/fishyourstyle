"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ProductForm, type ProductFormValues } from "../components/ProductForm";
import {
  fetchProductById,
  updateProduct,
  type AdminProduct,
} from "@/lib/admin-products";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

type PageProps = { params: Promise<{ id: string }> };

type Toast = { type: "success" | "error"; message: string };

export default function EditProductPage({ params }: PageProps) {
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const showToast = useCallback((payload: Toast) => {
    setToast(payload);
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve(params)
      .then((resolved) => {
        if (!active) return;
        setProductId(resolved.id);
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unable to read route params";
        setError(message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await fetchProductById(productId);
        setProduct(data);
        if (!data) {
          setError("Product not found");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load product";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleUploadImage = useCallback(async (file: File) => {
    setUploadingImage(true);
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

  const handleSubmit = useCallback(
    async (values: ProductFormValues) => {
      if (!product) return;
      setSaving(true);
      setError(null);
      try {
        await updateProduct(product.id, {
          name: values.name.trim(),
          price: Number(values.price),
          stock: Number(values.stock),
          description: values.description?.trim() || undefined,
          category: values.category?.trim() || undefined,
          imageUrl: values.imageUrl || undefined,
          tags: values.tags
            ? values.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
        });

        showToast({ type: "success", message: "Product updated" });
        router.push("/admin/products");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update product";
        setError(message);
        showToast({ type: "error", message });
      } finally {
        setSaving(false);
      }
    },
    [product, router, showToast],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Products</p>
        <h1 className="text-2xl font-semibold text-white">Loading product...</h1>
        <div className="h-32 rounded-3xl border border-white/10 bg-white/10" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Products</p>
        <h1 className="text-2xl font-semibold text-white">Product not found</h1>
        {error ? <p className="text-sm text-rose-200">{error}</p> : null}
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  const initialValues: ProductFormValues = {
    name: product.name,
    price: product.price,
    description: product.description ?? "",
    stock: product.stock,
    category: product.category ?? "",
    tags: (product.tags ?? []).join(", "),
    imageUrl: product.imageUrl ?? "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Products</p>
          <h1 className="text-3xl font-semibold text-white">Edit product</h1>
          <p className="max-w-2xl text-sky-100/85">Update product details, swap images, and keep Firestore in sync.</p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          ← Back to list
        </Link>
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

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-900/40">
        <ProductForm
          heading="Edit"
          subheading={`Editing ${product.name}`}
          submitLabel="Save changes"
          initialValues={initialValues}
          loading={saving}
          uploading={uploadingImage}
          onSubmit={handleSubmit}
          onUploadImage={handleUploadImage}
        />
      </div>
    </div>
  );
}
