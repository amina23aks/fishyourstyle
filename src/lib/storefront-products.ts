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
  gender?: "unisex" | "men" | "women";
  stock: number;
  inStock: boolean;
  images: StorefrontProductImages;
  tags?: string[];
  status: "active" | "inactive";
};

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

  const imagesValue = (() => {
    if (data && typeof data.images === "object" && !Array.isArray(data.images)) {
      const imagesObj = data.images as { main?: unknown; gallery?: unknown };
      const main = typeof imagesObj.main === "string" && imagesObj.main ? imagesObj.main : "";
      const gallery = Array.isArray(imagesObj.gallery)
        ? (imagesObj.gallery as unknown[])
            .map((img) => (typeof img === "string" ? img : null))
            .filter((img): img is string => Boolean(img))
        : [];
      return { main, gallery } satisfies StorefrontProductImages;
    }

    const imagesArray = Array.isArray(data.images) ? (data.images as string[]).filter(Boolean) : [];
    const [main, ...gallery] = imagesArray;
    return { main: main ?? "", gallery } satisfies StorefrontProductImages;
  })();

  const validGenders: StorefrontProduct["gender"][] = ["unisex", "men", "women"];
  const genderValue = data.gender;
  const gender =
    typeof genderValue === "string" && validGenders.includes(genderValue as StorefrontProduct["gender"])
      ? (genderValue as StorefrontProduct["gender"])
      : undefined;

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
    stock: typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0),
    inStock: typeof data.inStock === "boolean" ? data.inStock : Boolean(data.stock ?? 0),
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
