import { FirebaseError } from "firebase/app";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  type DocumentData,
  type QueryConstraint
} from "firebase/firestore";

import { getServerDb } from "./firestore";
import { isFirebaseConfigured } from "./firebaseConfig";

export type StorefrontProductImages = {
  main: string;
  gallery: string[];
};

export type StorefrontProductColor =
  | string
  | {
      id: string;
      labelFr?: string;
      labelAr?: string;
      image?: string;
    };

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  category: string;
  designTheme: string;
  sizes: string[];
  colors: StorefrontProductColor[];
  soldOutSizes?: string[];
  soldOutColorCodes?: string[];
  gender?: "unisex" | "men" | "women";
  stock: number;
  inStock: boolean;
  images: StorefrontProductImages;
  tags?: string[];
  status: "active" | "inactive";
};

function normalizeImagesField(images: unknown): StorefrontProductImages {
  const collected: string[] = [];

  if (Array.isArray(images)) {
    collected.push(...images.map(String));
  } else if (images && typeof images === "object") {
    const imagesObj = images as { main?: unknown; gallery?: unknown };
    if (typeof imagesObj.main === "string") {
      collected.push(imagesObj.main);
    }
    if (Array.isArray(imagesObj.gallery)) {
      collected.push(...imagesObj.gallery.map(String));
    }
  }

  const uniqueImages = Array.from(new Set(collected.filter(Boolean)));
  let [main, ...gallery] = uniqueImages;

  if (!main && gallery.length > 0) {
    [main, ...gallery] = gallery;
  }

  const finalMain = main ?? "";
  const finalGallery = gallery.filter((url) => url !== finalMain);

  return { main: finalMain, gallery: finalGallery } satisfies StorefrontProductImages;
}

function parseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : String(item))).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeProduct(data: DocumentData, id: string): StorefrontProduct {
  const basePrice = typeof data.basePrice === "number" ? data.basePrice : Number(data.basePrice ?? 0);
  const discountPercent =
    typeof data.discountPercent === "number" ? data.discountPercent : Number(data.discountPercent ?? 0);
  const finalPrice =
    typeof data.finalPrice === "number"
      ? data.finalPrice
      : Math.max(basePrice * (1 - discountPercent / 100), 0);

  const colorsArray: StorefrontProductColor[] = Array.isArray(data.colors)
    ? (data.colors as unknown[]).reduce<StorefrontProductColor[]>((acc, c) => {
        if (typeof c === "string") {
          acc.push(c);
          return acc;
        }
        if (c && typeof c === "object") {
          const color = c as { id?: unknown; labelFr?: unknown; labelAr?: unknown; image?: unknown; hex?: unknown };
          const id = typeof color.id === "string" && color.id ? color.id : typeof color.hex === "string" ? color.hex : null;
          if (!id) return acc;
          acc.push({
            id,
            labelFr: typeof color.labelFr === "string" ? color.labelFr : undefined,
            labelAr: typeof color.labelAr === "string" ? color.labelAr : undefined,
            image: typeof color.image === "string" ? color.image : undefined,
          });
        }
        return acc;
      }, [])
    : [];

  const imagesValue = normalizeImagesField(data.images);

  const validGenders: StorefrontProduct["gender"][] = ["unisex", "men", "women"];
  const genderValue = data.gender;
  const gender =
    typeof genderValue === "string" && validGenders.includes(genderValue as StorefrontProduct["gender"])
      ? (genderValue as StorefrontProduct["gender"])
      : undefined;
  const soldOutSizes = parseStringArray(data.soldOutSizes);
  const soldOutColorCodes = parseStringArray(data.soldOutColorCodes);

  return {
    id,
    slug: typeof data.slug === "string" ? data.slug : "",
    name: typeof data.name === "string" ? data.name : "Untitled product",
    description: typeof data.description === "string" ? data.description : undefined,
    basePrice,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
    finalPrice,
    category: typeof data.category === "string" ? data.category : "tshirts",
    designTheme: typeof data.designTheme === "string" ? data.designTheme : "simple",
    sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
    colors: colorsArray,
    gender,
    soldOutSizes: soldOutSizes.length > 0 ? soldOutSizes : undefined,
    soldOutColorCodes: soldOutColorCodes.length > 0 ? soldOutColorCodes : undefined,
    stock: typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0),
    inStock:
      typeof data.inStock === "boolean"
        ? data.inStock
        : (typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0)) > 0,
    images: imagesValue,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    status: data.status === "inactive" ? "inactive" : "active",
  };
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "permission-denied";
}

export async function fetchAllStorefrontProducts(): Promise<StorefrontProduct[]> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase env vars are missing; returning an empty product list.");
    return [];
  }

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(query(productsRef));
    return snapshot.docs
      .map((doc) => normalizeProduct(doc.data(), doc.id))
      .filter((product) => product.status === "active");
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn("Firestore permission denied while reading storefront products; returning empty list.");
    } else {
      console.error("Failed to fetch storefront products from Firestore, returning empty list:", error);
    }
    return [];
  }
}

export async function fetchStorefrontProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase env vars are missing; unable to fetch product by slug.");
    return null;
  }

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const constraints: QueryConstraint[] = [where("slug", "==", slug), limit(1)];
    const snapshot = await getDocs(query(productsRef, ...constraints));
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const product = normalizeProduct(doc.data(), doc.id);
    return product.status === "active" ? product : null;
  } catch (error) {
    console.error(`Failed to fetch product by slug "${slug}" from Firestore:`, error);
    return null;
  }
}
