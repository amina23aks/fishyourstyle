import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { getServerDb } from "./firestore";

export type SelectableItem = {
  id: string;
  label: string;
  slug: string;
  isDefault?: boolean;
};

const DEFAULT_CATEGORIES: SelectableItem[] = [
  { id: "hoodies", label: "Hoodies", slug: "hoodies", isDefault: true },
  { id: "pants", label: "Pants", slug: "pants", isDefault: true },
  { id: "ensembles", label: "Ensembles", slug: "ensembles", isDefault: true },
  { id: "tshirts", label: "Tshirts", slug: "tshirts", isDefault: true },
  { id: "amina", label: "Amina", slug: "amina", isDefault: true },
];

const DEFAULT_DESIGNS: SelectableItem[] = [
  { id: "basic", label: "Basic", slug: "basic", isDefault: true },
  { id: "cars", label: "Cars", slug: "cars", isDefault: true },
  { id: "anime", label: "Anime", slug: "anime", isDefault: true },
  { id: "nature", label: "Nature", slug: "nature", isDefault: true },
  { id: "harry-potter", label: "Harry Potter", slug: "harry-potter", isDefault: true },
];

const CATEGORY_COLLECTION = "categories";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function mergeOptions(defaults: SelectableItem[], fetched: SelectableItem[]): SelectableItem[] {
  const merged = new Map<string, SelectableItem>();

  defaults.forEach((item) => merged.set(item.slug, item));
  fetched.forEach((item) => {
    const existing = merged.get(item.slug);
    merged.set(item.slug, { ...item, isDefault: existing?.isDefault ?? item.isDefault });
  });

  return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label));
}

async function fetchFromFirestore(type: "category" | "design"): Promise<SelectableItem[]> {
  const db = getServerDb();
  const categoriesRef = collection(db, CATEGORY_COLLECTION);
  const snapshot = await getDocs(query(categoriesRef, where("type", "==", type), orderBy("name", "asc")));

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const label = typeof data.name === "string" ? data.name : typeof data.label === "string" ? data.label : "";
    const slug = typeof data.slug === "string" && data.slug ? data.slug : slugify(label);
    const isDefault = [...DEFAULT_CATEGORIES, ...DEFAULT_DESIGNS].some((entry) => entry.slug === slug);
    return {
      id: docSnap.id,
      label,
      slug,
      isDefault,
    } satisfies SelectableItem;
  });
}

function handlePermissionDenied(error: unknown) {
  return error instanceof FirebaseError && error.code === "permission-denied";
}

export async function getSelectableCategories(): Promise<SelectableItem[]> {
  try {
    const fetched = await fetchFromFirestore("category");
    return mergeOptions(DEFAULT_CATEGORIES, fetched);
  } catch (error) {
    if (!handlePermissionDenied(error)) {
      console.error("Failed to fetch categories from Firestore; using defaults.", error);
    }
    return DEFAULT_CATEGORIES;
  }
}

export async function getSelectableDesigns(): Promise<SelectableItem[]> {
  try {
    const fetched = await fetchFromFirestore("design");
    return mergeOptions(DEFAULT_DESIGNS, fetched);
  } catch (error) {
    if (!handlePermissionDenied(error)) {
      console.error("Failed to fetch designs from Firestore; using defaults.", error);
    }
    return DEFAULT_DESIGNS;
  }
}

export async function getSelectableCollectionsAndDesigns(): Promise<{
  collections: SelectableItem[];
  designs: SelectableItem[];
}> {
  const [collections, designs] = await Promise.all([getSelectableCategories(), getSelectableDesigns()]);
  return { collections, designs };
}

async function addEntry(label: string, type: "category" | "design"): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;

  const db = getServerDb();
  const categoriesRef = collection(db, CATEGORY_COLLECTION);

  await addDoc(categoriesRef, {
    name: trimmed,
    label: trimmed,
    slug: slugify(trimmed),
    type,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function addCategory(label: string): Promise<void> {
  return addEntry(label, "category");
}

export async function addDesign(label: string): Promise<void> {
  return addEntry(label, "design");
}

async function deleteByIdOrSlug(idOrSlug: string, type: "category" | "design") {
  const db = getServerDb();
  const categoriesRef = collection(db, CATEGORY_COLLECTION);
  const docRef = doc(db, CATEGORY_COLLECTION, idOrSlug);

  try {
    await deleteDoc(docRef);
    return;
  } catch (error) {
    if (!(error instanceof FirebaseError) || error.code !== "permission-denied") {
      console.warn("Direct delete failed, attempting by slug", error);
    }
  }

  const slug = slugify(idOrSlug);
  const matches = await getDocs(query(categoriesRef, where("slug", "==", slug), where("type", "==", type)));
  const deletions = matches.docs.map((snap) => deleteDoc(snap.ref));
  await Promise.all(deletions);
}

export async function deleteCategory(idOrSlug: string): Promise<void> {
  return deleteByIdOrSlug(idOrSlug, "category");
}

export async function deleteDesign(idOrSlug: string): Promise<void> {
  return deleteByIdOrSlug(idOrSlug, "design");
}

export const DEFAULT_CATEGORY_OPTIONS = DEFAULT_CATEGORIES;
export const DEFAULT_DESIGN_OPTIONS = DEFAULT_DESIGNS;

export function generateSlug(name: string): string {
  return slugify(name);
}
