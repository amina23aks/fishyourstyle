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

function normalizeCategory(data: DocumentData, id: string): Category {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    type: data.type === "design" ? "design" : "category",
    createdAt: (data.createdAt as Timestamp) ?? serverTimestamp(),
    updatedAt: (data.updatedAt as Timestamp) ?? serverTimestamp(),
  };
}

function fallbackCategories(type?: "category" | "design"): Category[] {
  const base: Category[] = [
    {
      id: "hoodies",
      name: "Hoodies",
      slug: "hoodies",
      type: "category",
      isDefault: true,
      createdAt: new Date() as unknown as Timestamp,
      updatedAt: new Date() as unknown as Timestamp,
    },
    {
      id: "pants",
      name: "Pants",
      slug: "pants",
      type: "category",
      isDefault: true,
      createdAt: new Date() as unknown as Timestamp,
      updatedAt: new Date() as unknown as Timestamp,
    },
    {
      id: "ensembles",
      name: "Ensembles",
      slug: "ensembles",
      type: "category",
      isDefault: true,
      createdAt: new Date() as unknown as Timestamp,
      updatedAt: new Date() as unknown as Timestamp,
    },
    {
      id: "tshirts",
      name: "Tshirts",
      slug: "tshirts",
      type: "category",
      isDefault: true,
      createdAt: new Date() as unknown as Timestamp,
      updatedAt: new Date() as unknown as Timestamp,
    },
    {
      id: "basic",
      name: "Basic",
      slug: "basic",
      type: "design",
      isDefault: true,
      createdAt: new Date() as unknown as Timestamp,
      updatedAt: new Date() as unknown as Timestamp,
    },
    {
      id: "nautical",
      name: "Nautical",
      slug: "nautical",
      type: "design",
      isDefault: true,
      createdAt: new Date() as unknown as Timestamp,
      updatedAt: new Date() as unknown as Timestamp,
    },
  ];

  if (!type) return base;
  return base.filter((item) => item.type === type);
}

export async function fetchAllCategories(type?: "category" | "design"): Promise<Category[]> {
  try {
    const db = getServerDb();
    const categoriesRef = collection(db, "categories");
    const baseQuery = type
      ? query(categoriesRef, where("type", "==", type), orderBy("name", "asc"))
      : query(categoriesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(baseQuery);
    return snapshot.docs.map((doc) => normalizeCategory(doc.data(), doc.id));
  } catch (error) {
    console.error("Failed to fetch categories from Firestore, using fallbacks:", error);
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

