import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Timestamp,
  type WithFieldValue,
} from "firebase/firestore";

import { getDb } from "./firebaseClient";

export type AdminProductCategory = string;

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  category: AdminProductCategory;
  designTheme: string;
  sizes: string[];
  colors: { id: string; labelFr: string; labelAr?: string; image?: string }[];
  stock: number;
  inStock: boolean;
  images: { main: string; gallery: string[] };
  gender?: "unisex" | "men" | "women";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type AdminProductInput = Omit<AdminProduct, "id" | "createdAt" | "updatedAt">;
type AdminProductWrite = AdminProductInput & { updatedAt: Timestamp; createdAt?: Timestamp };

function getDbOrThrow() {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase is not configured. Please check environment variables.");
  }
  return db;
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : String(item))).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseColorObjects(value: unknown): AdminProduct["colors"] {
  const normalizeEntry = (item: unknown) => {
    if (typeof item === "string") {
      return { id: item, labelFr: item, labelAr: item };
    }
    if (item && typeof item === "object") {
      const obj = item as { id?: unknown; labelFr?: unknown; labelAr?: unknown; image?: unknown; hex?: unknown };
      const id =
        (typeof obj.id === "string" && obj.id.trim()) ||
        (typeof obj.hex === "string" && obj.hex.trim()) ||
        null;
      if (!id) return null;
      const labelFr = (typeof obj.labelFr === "string" && obj.labelFr.trim()) || id;
      const labelAr = typeof obj.labelAr === "string" && obj.labelAr.trim() ? obj.labelAr.trim() : undefined;
      const image = typeof obj.image === "string" && obj.image.trim() ? obj.image.trim() : undefined;
      return { id, labelFr, labelAr, image } satisfies AdminProduct["colors"][number];
    }
    return null;
  };

  if (!value) return [];
  if (Array.isArray(value)) {
    const normalized = value
      .map(normalizeEntry)
      .filter((item): item is NonNullable<ReturnType<typeof normalizeEntry>> => Boolean(item))
      .map((item) => {
        const entry: AdminProduct["colors"][number] = { id: item.id, labelFr: item.labelFr };
        if (item.labelAr) entry.labelAr = item.labelAr;
        if (item.image) entry.image = item.image;
        return entry;
      });
    if (normalized.length === 0 && value.length === 0) return [];
    return normalized;
  }
  return [];
}

function computeFinalPrice(basePrice: number, discountPercent: number) {
  const base = Number(basePrice) || 0;
  const discount = Number(discountPercent) || 0;
  return Math.max(base * (1 - discount / 100), 0);
}

function normalizeImages(value: unknown): { main: string; gallery: string[] } {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as { main?: unknown; gallery?: unknown };
    const main = typeof obj.main === "string" ? obj.main : "";
    const gallery = Array.isArray(obj.gallery)
      ? (obj.gallery as unknown[])
          .map((item) => (typeof item === "string" ? item : null))
          .filter((item): item is string => Boolean(item))
      : [];
    return { main, gallery };
  }

  if (Array.isArray(value)) {
    const [main, ...gallery] = (value as unknown[])
      .map((item) => (typeof item === "string" ? item : null))
      .filter((item): item is string => Boolean(item));
    return { main: main ?? "", gallery };
  }

  return { main: "", gallery: [] };
}

function normalizeProduct(data: DocumentData, id: string): AdminProduct {
  const basePrice = typeof data.basePrice === "number" ? data.basePrice : Number(data.basePrice ?? 0);
  const discountPercent =
    typeof data.discountPercent === "number" ? data.discountPercent : Number(data.discountPercent ?? 0);

  const finalPrice =
    typeof data.finalPrice === "number"
      ? data.finalPrice
      : computeFinalPrice(basePrice, Number.isFinite(discountPercent) ? discountPercent : 0);

  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled product",
    slug: typeof data.slug === "string" && data.slug.length ? data.slug : slugifyName(data.name ?? id),
    description: typeof data.description === "string" && data.description.trim() ? data.description.trim() : undefined,
    basePrice,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
    finalPrice,
    category: (data.category as AdminProductCategory) ?? "tshirts",
    designTheme: typeof data.designTheme === "string" ? data.designTheme : "simple",
    sizes: parseStringArray(data.sizes),
    colors: parseColorObjects(data.colors),
    stock: typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0),
    inStock: typeof data.inStock === "boolean" ? data.inStock : Boolean(data.stock ?? 0),
    images: normalizeImages(data.images),
    gender: typeof data.gender === "string" ? (data.gender as AdminProduct["gender"]) : undefined,
    createdAt: (data.createdAt as Timestamp) ?? (serverTimestamp() as unknown as Timestamp),
    updatedAt: (data.updatedAt as Timestamp) ?? (serverTimestamp() as unknown as Timestamp),
  };
}

function sanitizeCreate(input: AdminProductInput): WithFieldValue<AdminProductWrite> {
  const normalizedColors = parseColorObjects(input.colors);
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    slug: input.slug || slugifyName(input.name),
    basePrice: Number(input.basePrice),
    discountPercent: Number(input.discountPercent) || 0,
    finalPrice: computeFinalPrice(Number(input.basePrice), Number(input.discountPercent) || 0),
    category: input.category,
    designTheme: input.designTheme,
    sizes: input.sizes ?? [],
    colors: normalizedColors,
    stock: Number(input.stock),
    inStock: Boolean(input.inStock),
    images: input.images ?? { main: "", gallery: [] },
    gender: input.gender ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only include description if it's a non-empty string
  if (input.description && typeof input.description === "string" && input.description.trim()) {
    payload.description = input.description.trim();
  }

  return payload as WithFieldValue<AdminProductWrite>;
}

function sanitizeUpdate(patch: Partial<AdminProduct>): WithFieldValue<Partial<AdminProductWrite>> {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (patch.name !== undefined) {
    payload.name = patch.name.trim();
    payload.slug = slugifyName(patch.name);
  }
  if (patch.slug !== undefined) payload.slug = slugifyName(patch.slug);
  if (patch.description !== undefined) {
    // Only include description if it's a non-empty string, otherwise set to null to remove it
    if (patch.description && typeof patch.description === "string" && patch.description.trim()) {
      payload.description = patch.description.trim();
    } else {
      payload.description = null;
    }
  }
  if (patch.basePrice !== undefined) payload.basePrice = Number(patch.basePrice);
  if (patch.discountPercent !== undefined) payload.discountPercent = Number(patch.discountPercent) || 0;
  if (patch.basePrice !== undefined || patch.discountPercent !== undefined) {
    const base = patch.basePrice !== undefined ? Number(patch.basePrice) : 0;
    const discount = patch.discountPercent !== undefined ? Number(patch.discountPercent) || 0 : 0;
    payload.finalPrice = computeFinalPrice(base, discount);
  }
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.designTheme !== undefined) payload.designTheme = patch.designTheme;
  if (patch.sizes !== undefined) payload.sizes = patch.sizes;
  if (patch.colors !== undefined) payload.colors = parseColorObjects(patch.colors);
  if (patch.stock !== undefined) payload.stock = Number(patch.stock);
  if (patch.inStock !== undefined) payload.inStock = Boolean(patch.inStock);
  if (patch.images !== undefined) payload.images = patch.images;
  if (patch.gender !== undefined) payload.gender = patch.gender ?? null;

  return payload as WithFieldValue<Partial<AdminProductWrite>>;
}

function wrapPermission<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((err) => {
    if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "permission-denied") {
      throw new Error("Missing or insufficient permissions.");
    }
    throw err;
  });
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const db = getDbOrThrow();
  const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return wrapPermission(async () => {
    const snapshot = await getDocs(productsQuery);
    return snapshot.docs.map((docSnapshot) => normalizeProduct(docSnapshot.data(), docSnapshot.id));
  });
}

export async function fetchProductById(productId: string): Promise<AdminProduct | null> {
  const db = getDbOrThrow();
  const ref = doc(db, "products", productId);
  return wrapPermission(async () => {
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return normalizeProduct(snapshot.data(), snapshot.id);
  });
}

export async function createAdminProduct(input: AdminProductInput): Promise<void> {
  const db = getDbOrThrow();
  const payload = sanitizeCreate(input);
  return wrapPermission(async () => {
    await addDoc(collection(db, "products"), payload);
  });
}

export async function updateAdminProduct(productId: string, updates: Partial<AdminProduct>): Promise<void> {
  const db = getDbOrThrow();
  const payload = sanitizeUpdate(updates);
  const ref = doc(db, "products", productId);
  return wrapPermission(async () => updateDoc(ref, payload));
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  const db = getDbOrThrow();
  const ref = doc(db, "products", productId);
  return wrapPermission(async () => deleteDoc(ref));
}
