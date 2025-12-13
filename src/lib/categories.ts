import "server-only";

import { FirebaseError } from "firebase/app";
import { collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";


import { getServerDb } from "./firestore";
import { isFirebaseConfigured } from "./firebaseConfig";
import { getAdminDb, isAdminConfigured } from "./firebaseAdmin";
import {
  CANONICAL_CATEGORIES,
  CANONICAL_CATEGORY_SLUGS,
  CANONICAL_DESIGNS,
  CANONICAL_DESIGN_SLUGS,
  slugify,
  type SelectableItem,
} from "./categories-shared";
export type { SelectableItem } from "./categories-shared";

const CATEGORY_COLLECTION = "categories";

function normalizeType(value: unknown): "collection" | "design" | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase();
  if (["collection", "category"].includes(normalized)) return "collection";
  if (["design", "theme", "design-theme", "designtheme"].includes(normalized)) return "design";
  return null;
}

function buildSelectableFromDoc(
  data: Record<string, unknown>,
  fallbackId: string,
  requestedType: "collection" | "design",
): SelectableItem | null {
  const label = typeof data.name === "string" ? data.name : typeof data.label === "string" ? data.label : fallbackId;
  const slug = typeof data.slug === "string" && data.slug ? data.slug : slugify(label);
  const normalizedType = normalizeType(data.type) ?? requestedType;
  if (normalizedType !== requestedType) {
    return null;
  }

  return {
    id: slug,
    slug,
    label,
    isDefault: CANONICAL_CATEGORY_SLUGS.includes(slug as (typeof CANONICAL_CATEGORY_SLUGS)[number]) ||
      CANONICAL_DESIGN_SLUGS.includes(slug as (typeof CANONICAL_DESIGN_SLUGS)[number]),
  } satisfies SelectableItem;
}

async function fetchFromFirestore(type: "collection" | "design"): Promise<SelectableItem[]> {
  if (!isFirebaseConfigured() && !isAdminConfigured()) {
    return [];
  }

  const adminDb = getAdminDb();
  if (adminDb) {
    const snapshot = await adminDb.collection(CATEGORY_COLLECTION).where("type", "==", type).get();
    return snapshot.docs
      .map((docSnap) => buildSelectableFromDoc(docSnap.data() as Record<string, unknown>, docSnap.id, type))
      .filter((item): item is SelectableItem => Boolean(item));
  }

  const db = getServerDb();
  const categoriesRef = collection(db, CATEGORY_COLLECTION);
  const snapshot = await getDocs(query(categoriesRef, where("type", "==", type)));

  const items = snapshot.docs
    .map((docSnap) => buildSelectableFromDoc(docSnap.data(), docSnap.id, type))
    .filter((item): item is SelectableItem => Boolean(item));

  return items;
}

function handlePermissionDenied(error: unknown) {
  return error instanceof FirebaseError && error.code === "permission-denied";
}

async function getSelectableItems(type: "collection" | "design"): Promise<SelectableItem[]> {
  const fallback = type === "collection" ? CANONICAL_CATEGORIES : CANONICAL_DESIGNS;
  const hasFirestoreConfig = isFirebaseConfigured() || isAdminConfigured();
  if (!hasFirestoreConfig) {
    return fallback;
  }

  try {
    const fetched = await fetchFromFirestore(type);
    if (fetched.length > 0) return fetched;
    return [];
  } catch (error) {
    if (!handlePermissionDenied(error)) {
      console.error(`Failed to fetch ${type}s from Firestore`, error);
    }
    return fallback;
  }
}

/** Fetch selectable collections (categories) from Firestore only. */
export async function getSelectableCollections(): Promise<SelectableItem[]> {
  return getSelectableItems("collection");
}

/** Fetch selectable design themes from Firestore only. */
export async function getSelectableDesigns(): Promise<SelectableItem[]> {
  return getSelectableItems("design");
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

  if (!isFirebaseConfigured() && !isAdminConfigured()) {
    throw new Error(
      "Firebase is not configured. Please add your Firebase environment variables (client or Admin SDK) to manage categories/designs.",
    );
  }

  const slug = slugify(trimmed);
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb.collection(CATEGORY_COLLECTION).doc(slug).set({
        name: trimmed,
        label: trimmed,
        slug,
        type,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return;
    } catch (error) {
      console.error("Admin SDK failed to add entry", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to add category/design via Admin SDK. Check credentials and Firestore.");
    }
  }

  const db = getServerDb();
  const docRef = doc(db, CATEGORY_COLLECTION, slug);

  try {
    await setDoc(docRef, {
      name: trimmed,
      label: trimmed,
      slug,
      type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (handlePermissionDenied(error)) {
      throw new Error(
        "You do not have permission to add categories/designs. Update Firestore rules or configure Admin SDK credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
      );
    }
    throw error;
  }
}

export async function addCategory(label: string): Promise<void> {
  return addEntry(label, "collection");
}

export async function addDesign(label: string): Promise<void> {
  return addEntry(label, "design");
}

async function deleteByIdOrSlug(idOrSlug: string, type: "collection" | "design") {
  const slug = slugify(idOrSlug);

  const referencingField = type === "collection" ? "category" : "designTheme";

  const adminDb = getAdminDb();
  if (adminDb) {
    const inUseSnapshot = await adminDb
      .collection("products")
      .where(referencingField, "==", slug)
      .limit(1)
      .get();
    if (!inUseSnapshot.empty) {
      throw new Error(`Cannot delete ${type}; products still reference ${slug}.`);
    }
  } else {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "Firebase is not configured. Please add your Firebase environment variables (client or Admin SDK) to manage categories/designs.",
      );
    }

    const db = getServerDb();
    const productsRef = collection(db, "products");
    const inUse = await getDocs(query(productsRef, where(referencingField, "==", slug), limit(1)));
    if (!inUse.empty) {
      throw new Error(`Cannot delete ${type}; products still reference ${slug}.`);
    }
  }

  if (adminDb) {
    try {
      await adminDb.collection(CATEGORY_COLLECTION).doc(slug).delete();
      return;
    } catch (error) {
      console.error("Admin SDK failed to delete entry", error);
    }
  }

  const db = getServerDb();
  const docRef = doc(db, CATEGORY_COLLECTION, slug);

  try {
    await deleteDoc(docRef);
    return;
  } catch (error) {
    if (handlePermissionDenied(error)) {
      throw new Error(
        "You do not have permission to delete categories/designs. Update Firestore rules or configure Admin SDK credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
      );
    }
    console.warn("Direct delete failed, attempting by slug", error);
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
// Backwards compatible export for existing imports
export const getSelectableCategories = getSelectableCollections;

export function generateSlug(name: string): string {
  return slugify(name);
}
