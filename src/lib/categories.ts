import { FirebaseError } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { getServerDb } from "./firestore";
import { isFirebaseConfigured } from "./firebaseConfig";

export type SelectableItem = {
  /**
   * Stable identifier used for slugs and Firestore document IDs.
   * This is returned even when Firestore is unavailable so UI pills stay consistent.
   */
  id: string;
  /** Human-friendly label shown in the UI. */
  label: string;
  /** Deterministic slug (alias for `id`) for filters and product association. */
  slug: string;
  /** Whether the entry is protected from deletion. */
  isDefault: boolean;
};

const DEFAULT_CATEGORIES: SelectableItem[] = [
  { id: "hoodies", label: "Hoodies", slug: "hoodies", isDefault: true },
  { id: "pants", label: "Pants", slug: "pants", isDefault: true },
  { id: "ensembles", label: "Ensembles", slug: "ensembles", isDefault: true },
  { id: "tshirts", label: "Tshirts", slug: "tshirts", isDefault: true },
];

const DEFAULT_DESIGNS: SelectableItem[] = [
  { id: "basic", label: "Basic", slug: "basic", isDefault: true },
  { id: "cars", label: "Cars", slug: "cars", isDefault: true },
  { id: "anime", label: "Anime", slug: "anime", isDefault: true },
  { id: "nature", label: "Nature", slug: "nature", isDefault: true },
  { id: "harry-potter", label: "Harry Potter", slug: "harry-potter", isDefault: true },
];

const CATEGORY_COLLECTION = "categories";
const DEFAULT_KEYS = new Set([...DEFAULT_CATEGORIES, ...DEFAULT_DESIGNS].map((item) => item.slug));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function mergeWithDefaults(defaults: SelectableItem[], fetched: SelectableItem[]): SelectableItem[] {
  const merged = new Map<string, SelectableItem>();

  defaults.forEach((item) => merged.set(item.slug, item));
  fetched.forEach((item) => {
    const slug = item.slug || item.id;
    const isDefault = merged.get(slug)?.isDefault ?? DEFAULT_KEYS.has(slug);
    merged.set(slug, { ...item, id: slug, slug, isDefault });
  });

  return Array.from(merged.values()).sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.label.localeCompare(b.label);
  });
}

function buildSelectableFromDoc(
  data: Record<string, unknown>,
  fallbackId: string,
  requestedType: "collection" | "design",
): SelectableItem | null {
  const label = typeof data.name === "string" ? data.name : typeof data.label === "string" ? data.label : fallbackId;
  const slug = typeof data.slug === "string" && data.slug ? data.slug : slugify(label);
  const type = (typeof data.type === "string" ? data.type : "collection").toLowerCase();
  if (type !== requestedType && !(requestedType === "collection" && type === "category")) {
    return null;
  }

  return {
    id: slug,
    slug,
    label,
    isDefault: DEFAULT_KEYS.has(slug),
  } satisfies SelectableItem;
}

async function fetchFromFirestore(type: "collection" | "design"): Promise<SelectableItem[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getServerDb();
  const categoriesRef = collection(db, CATEGORY_COLLECTION);
  const snapshot = await getDocs(categoriesRef);

  const items = snapshot.docs
    .map((docSnap) => buildSelectableFromDoc(docSnap.data(), docSnap.id, type))
    .filter((item): item is SelectableItem => Boolean(item));

  return items;
}

function handlePermissionDenied(error: unknown) {
  return error instanceof FirebaseError && error.code === "permission-denied";
}

async function getSelectableItems(
  type: "collection" | "design",
  defaults: SelectableItem[],
): Promise<SelectableItem[]> {
  try {
    const fetched = await fetchFromFirestore(type);
    if (!fetched.length) {
      return defaults;
    }
    return mergeWithDefaults(defaults, fetched);
  } catch (error) {
    if (!handlePermissionDenied(error)) {
      console.error(`Failed to fetch ${type}s from Firestore; using defaults.`, error);
    }
    return defaults;
  }
}

/**
 * Fetch selectable collections (categories). When Firestore is empty or unreachable,
 * defaults are returned so UI filters remain functional.
 */
export async function getSelectableCollections(): Promise<SelectableItem[]> {
  return getSelectableItems("collection", DEFAULT_CATEGORIES);
}

/**
 * Fetch selectable design themes with the same fallback logic as collections.
 */
export async function getSelectableDesigns(): Promise<SelectableItem[]> {
  return getSelectableItems("design", DEFAULT_DESIGNS);
}

/** Helper that loads both collections and designs for admin screens. */
export async function getSelectableCollectionsAndDesigns(): Promise<{
  collections: SelectableItem[];
  designs: SelectableItem[];
}> {
  const [collections, designs] = await Promise.all([getSelectableCollections(), getSelectableDesigns()]);
  return { collections, designs };
}

async function addEntry(label: string, type: "collection" | "design"): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Please add your Firebase environment variables.");
  }

  const slug = slugify(trimmed);
  const db = getServerDb();
  const docRef = doc(db, CATEGORY_COLLECTION, slug);

  await setDoc(docRef, {
    name: trimmed,
    label: trimmed,
    slug,
    type,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function addCategory(label: string): Promise<void> {
  return addEntry(label, "collection");
}

export async function addDesign(label: string): Promise<void> {
  return addEntry(label, "design");
}

async function deleteByIdOrSlug(idOrSlug: string, type: "collection" | "design") {
  const slug = slugify(idOrSlug);
  if (DEFAULT_KEYS.has(slug)) return;

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Please add your Firebase environment variables.");
  }

  const db = getServerDb();
  const docRef = doc(db, CATEGORY_COLLECTION, slug);

  try {
    await deleteDoc(docRef);
    return;
  } catch (error) {
    if (!(error instanceof FirebaseError) || error.code !== "permission-denied") {
      console.warn("Direct delete failed, attempting by slug", error);
    }
  }

  const categoriesRef = collection(db, CATEGORY_COLLECTION);
  const matches = await getDocs(query(categoriesRef, where("slug", "==", slug)));
  const deletions = matches.docs
    .filter((snap) => {
      const data = snap.data() as { type?: string };
      const entryType = (data.type ?? "collection").toLowerCase();
      const normalizedType = entryType === "category" ? "collection" : entryType;
      return normalizedType === type;
    })
    .map((snap) => deleteDoc(snap.ref));
  await Promise.all(deletions);
}

export async function deleteCategory(idOrSlug: string): Promise<void> {
  return deleteByIdOrSlug(idOrSlug, "collection");
}

export async function deleteDesign(idOrSlug: string): Promise<void> {
  return deleteByIdOrSlug(idOrSlug, "design");
}

export const DEFAULT_CATEGORY_OPTIONS = DEFAULT_CATEGORIES;
export const DEFAULT_DESIGN_OPTIONS = DEFAULT_DESIGNS;

// Backwards compatible export for existing imports
export const getSelectableCategories = getSelectableCollections;

export function generateSlug(name: string): string {
  return slugify(name);
}
