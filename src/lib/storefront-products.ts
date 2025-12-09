import {
  collection,
  getDocs,
  query,
  where,
  limit,
  type DocumentData,
  type QueryConstraint
} from "firebase/firestore";

import { getDb } from "./firebaseClient";

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  category: "hoodies" | "pants" | "ensembles" | "tshirts";
  designTheme: string;
  sizes: string[];
  colors: string[];
  gender?: "unisex" | "men" | "women";
  stock: number;
  inStock: boolean;
  images: string[];
};

function normalizeProduct(data: DocumentData, id: string): StorefrontProduct {
  const basePrice = typeof data.basePrice === "number" ? data.basePrice : Number(data.basePrice ?? 0);
  const discountPercent =
    typeof data.discountPercent === "number" ? data.discountPercent : Number(data.discountPercent ?? 0);
  const finalPrice =
    typeof data.finalPrice === "number"
      ? data.finalPrice
      : Math.max(basePrice * (1 - discountPercent / 100), 0);

  const colorsArray =
    Array.isArray(data.colors) && data.colors.length
      ? data.colors
          .map((c) => {
            if (typeof c === "string") return c;
            if (c && typeof c === "object" && "hex" in c) return String((c as { hex: unknown }).hex);
            return null;
          })
          .filter((c): c is string => Boolean(c))
      : [];

  const imagesArray = Array.isArray(data.images) ? (data.images as string[]).filter(Boolean) : [];

  return {
    id,
    slug: typeof data.slug === "string" ? data.slug : "",
    name: typeof data.name === "string" ? data.name : "Untitled product",
    description: typeof data.description === "string" ? data.description : undefined,
    basePrice,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
    finalPrice,
    category: (data.category as StorefrontProduct["category"]) ?? "tshirts",
    designTheme: typeof data.designTheme === "string" ? data.designTheme : "basic",
    sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
    colors: colorsArray,
    gender: typeof data.gender === "string" ? (data.gender as StorefrontProduct["gender"]) : undefined,
    stock: typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0),
    inStock: typeof data.inStock === "boolean" ? data.inStock : Boolean(data.stock ?? 0),
    images: imagesArray,
  };
}

export async function fetchAllStorefrontProducts(): Promise<StorefrontProduct[]> {
  const db = getDb(); // the same way as admin-products.ts
  const productsRef = collection(db, "products");
  const snapshot = await getDocs(query(productsRef));
  return snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id));
}

export async function fetchStorefrontProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const db = getDb(); // the same way as admin-products.ts
  const productsRef = collection(db, "products");
  const constraints: QueryConstraint[] = [where("slug", "==", slug), limit(1)];
  const snapshot = await getDocs(query(productsRef, ...constraints));
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return normalizeProduct(doc.data(), doc.id);
}