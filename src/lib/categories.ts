import { FirebaseError } from "firebase/app";
import { collection, doc, getDocs, addDoc, deleteDoc, query, orderBy, where, serverTimestamp, type DocumentData, type Timestamp } from "firebase/firestore";
import { getServerDb } from "./firestore";

export type Category = {
  id: string;
  name: string;
  slug: string;
  type?: "category" | "design";
  isDefault?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const DEFAULT_ENTRIES: Array<{
  id: string;
  name: string;
  slug: string;
  type: "category" | "design";
}> = [
  { id: "hoodies", name: "Hoodies", slug: "hoodies", type: "category" },
  { id: "pants", name: "Pants", slug: "pants", type: "category" },
  { id: "ensembles", name: "Ensembles", slug: "ensembles", type: "category" },
  { id: "tshirts", name: "Tshirts", slug: "tshirts", type: "category" },
  { id: "basic", name: "Basic", slug: "basic", type: "design" },
  { id: "cars", name: "Cars", slug: "cars", type: "design" },
  { id: "anime", name: "Anime", slug: "anime", type: "design" },
  { id: "nature", name: "Nature", slug: "nature", type: "design" },
  { id: "harry-potter", name: "Harry Potter", slug: "harry-potter", type: "design" },
];

export const DEFAULT_CATEGORY_OPTIONS = DEFAULT_ENTRIES.filter((item) => item.type === "category").map((item) => ({
  id: item.id,
  name: item.name,
  slug: item.slug,
  isDefault: true,
  type: item.type,
}));

export const DEFAULT_DESIGN_OPTIONS = DEFAULT_ENTRIES.filter((item) => item.type === "design").map((item) => ({
  id: item.id,
  name: item.name,
  slug: item.slug,
  isDefault: true,
  type: item.type,
}));

function normalizeCategory(data: DocumentData, id: string): Category {
  const slug = typeof data.slug === "string" ? data.slug : "";
  const isDefault = DEFAULT_ENTRIES.some((entry) => entry.slug === slug);
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    slug,
    type: data.type === "design" ? "design" : "category",
    isDefault,
    createdAt: (data.createdAt as Timestamp) ?? serverTimestamp(),
    updatedAt: (data.updatedAt as Timestamp) ?? serverTimestamp(),
  };
}

function fallbackCategories(type?: "category" | "design"): Category[] {
  const timestamp = new Date() as unknown as Timestamp;
  const base: Category[] = DEFAULT_ENTRIES.map((entry) => ({
    ...entry,
    isDefault: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  if (!type) return base;
  return base.filter((item) => item.type === type);
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "permission-denied";
}

// NOTE FOR OWNER:
// Public storefront pages need read access to the following Firestore collections:
//   - products
//   - categories (type "category" and "design")
//   - designThemes (if you split designs into their own collection)
// In production, configure Firestore Security Rules to allow reads for these public collections
// or adjust the app to require authentication before reading them.
// Example dev-only rule (do not use in locked-down production):
// match /products/{id} { allow read: if true; }

export async function fetchAllCategories(type?: "category" | "design"): Promise<Category[]> {
  try {
    const db = getServerDb();
    const categoriesRef = collection(db, "categories");
    const baseQuery = type
      ? query(categoriesRef, where("type", "==", type), orderBy("name", "asc"))
      : query(categoriesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(baseQuery);
    const fetched = snapshot.docs.map((doc) => normalizeCategory(doc.data(), doc.id));
    const defaults = fallbackCategories(type);
    const merged = new Map<string, Category>();
    defaults.forEach((item) => merged.set(item.slug, item));
    fetched.forEach((item) => merged.set(item.slug, item));
    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn("Firestore permission denied while reading categories; using fallback list.");
    } else {
      console.error("Failed to fetch categories from Firestore, using fallbacks:", error);
    }
    return fallbackCategories(type);
  }
}

export async function createCategory(name: string, slug: string, type: "category" | "design" = "category"): Promise<string> {
  const db = getServerDb();
  const categoriesRef = collection(db, "categories");
  const docRef = await addDoc(categoriesRef, {
    name,
    slug,
    type,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getServerDb();
  const categoryRef = doc(db, "categories", id);
  await deleteDoc(categoryRef);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateSlug(name: string): string {
  return slugify(name);
}

