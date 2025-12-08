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
} from "firebase/firestore";

import { getDb } from "./firebaseClient";

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock: number;
  category?: string;
  imageUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductInput = {
  name: string;
  price: number;
  description?: string;
  stock: number;
  category?: string;
  imageUrl?: string;
  tags?: string[];
};

function getDbOrThrow() {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase is not configured. Please check environment variables.");
  }
  return db;
}

function timestampToISO(timestamp: unknown): string | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (typeof timestamp === "string") return timestamp;
  if (typeof timestamp === "object" && "toDate" in (timestamp as Record<string, unknown>)) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  return undefined;
}

function normalizeProduct(data: DocumentData, id: string): AdminProduct {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled product",
    price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    description: typeof data.description === "string" ? data.description : undefined,
    stock: typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0),
    category: typeof data.category === "string" ? data.category : undefined,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    tags: Array.isArray(data.tags)
      ? data.tags.map((tag) => (typeof tag === "string" ? tag : String(tag))).filter(Boolean)
      : undefined,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
  };
}

function sanitizePayload(input: ProductInput, includeCreatedAt = false) {
  const payload: Record<string, unknown> = {
    name: input.name,
    price: input.price,
    stock: input.stock,
    tags: input.tags ?? [],
    updatedAt: serverTimestamp(),
  };

  if (input.description !== undefined) payload.description = input.description;
  if (input.category !== undefined) payload.category = input.category;
  if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl;
  if (includeCreatedAt) {
    payload.createdAt = serverTimestamp();
  }

  return payload;
}

export async function fetchProducts(): Promise<AdminProduct[]> {
  const db = getDbOrThrow();
  const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(productsQuery);
  return snapshot.docs.map((docSnapshot) => normalizeProduct(docSnapshot.data(), docSnapshot.id));
}

export async function fetchProductById(productId: string): Promise<AdminProduct | null> {
  const db = getDbOrThrow();
  const ref = doc(db, "products", productId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return normalizeProduct(snapshot.data(), snapshot.id);
}

export async function createProduct(input: ProductInput): Promise<string> {
  const db = getDbOrThrow();
  const payload = sanitizePayload(input, true);
  const ref = await addDoc(collection(db, "products"), payload);
  return ref.id;
}

export async function updateProduct(productId: string, updates: Partial<ProductInput>): Promise<void> {
  const db = getDbOrThrow();
  const payload = sanitizePayload(
    {
      name: updates.name ?? "",
      price: updates.price ?? 0,
      stock: updates.stock ?? 0,
      description: updates.description,
      category: updates.category,
      imageUrl: updates.imageUrl,
      tags: updates.tags,
    },
    false,
  );

  const ref = doc(db, "products", productId);
  await updateDoc(ref, payload);
}

export async function deleteProduct(productId: string): Promise<void> {
  const db = getDbOrThrow();
  const ref = doc(db, "products", productId);
  await deleteDoc(ref);
}
