import { FirebaseError } from "firebase/app";
import {
  collection,
  documentId,
  getDocs,
  orderBy,
  query,
  startAfter,
  where,
  limit,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import { getServerDb } from "./firestore";
import { isFirebaseConfigured } from "./firebaseConfig";
import type { SelectableItem } from "./categories-shared";
import { normalizeImageColorAssignments } from "./image-color-assignments";
import type { ProductImageColorAssignment } from "@/types/product";

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

export type StorefrontProductsCursor = {
  id: string;
};

export type StorefrontProductsPage = {
  products: StorefrontProduct[];
  nextCursor: StorefrontProductsCursor | null;
};

export type StorefrontProductsPageParams = {
  pageSize?: number;
  cursor?: StorefrontProductsCursor | null;
  category?: string;
  designTheme?: string;
};

export type StorefrontFilterProduct = {
  category: string;
  designTheme: string;
  status: "active";
};

type StorefrontProductStatus = "active" | "inactive" | "draft" | "hidden";

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
  sizeGuideEnabled: boolean;
  sizeGuideImageUrl?: string | null;
  sizeGuideImagePublicId?: string | null;
  soldOutSizes?: string[];
  soldOutColorCodes?: string[];
  gender?: "unisex" | "men" | "women";
  stockMode?: "unlimited" | "limited";
  stockQty?: number;
  inStock: boolean;
  images: StorefrontProductImages;
  imageColorAssignments?: ProductImageColorAssignment[];
  tags?: string[];
  featuredDrops?: string[];
  status: StorefrontProductStatus;
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

  return {
    main: finalMain,
    gallery: finalGallery,
  } satisfies StorefrontProductImages;
}

function parseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item)))
      .filter(Boolean);
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
  const basePrice =
    typeof data.basePrice === "number"
      ? data.basePrice
      : Number(data.basePrice ?? 0);
  const discountPercent =
    typeof data.discountPercent === "number"
      ? data.discountPercent
      : Number(data.discountPercent ?? 0);
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
          const color = c as {
            id?: unknown;
            labelFr?: unknown;
            labelAr?: unknown;
            image?: unknown;
            hex?: unknown;
          };
          const id =
            typeof color.id === "string" && color.id
              ? color.id
              : typeof color.hex === "string"
                ? color.hex
                : null;
          if (!id) return acc;
          acc.push({
            id,
            labelFr:
              typeof color.labelFr === "string" ? color.labelFr : undefined,
            labelAr:
              typeof color.labelAr === "string" ? color.labelAr : undefined,
            image: typeof color.image === "string" ? color.image : undefined,
          });
        }
        return acc;
      }, [])
    : [];

  const imagesValue = normalizeImagesField(data.images);

  const validGenders: StorefrontProduct["gender"][] = [
    "unisex",
    "men",
    "women",
  ];
  const genderValue = data.gender;
  const gender =
    typeof genderValue === "string" &&
    validGenders.includes(genderValue as StorefrontProduct["gender"])
      ? (genderValue as StorefrontProduct["gender"])
      : undefined;
  const soldOutSizes = parseStringArray(data.soldOutSizes);
  const soldOutColorCodes = parseStringArray(data.soldOutColorCodes);
  const legacyStockQuantity =
    typeof data.stockQuantity === "number"
      ? data.stockQuantity
      : typeof data.stock === "number"
        ? data.stock
        : Number(data.stock ?? 0);
  const inStockValue = typeof data.inStock === "boolean" ? data.inStock : true;
  const requestedMode =
    data.stockMode === "limited" || data.stockMode === "unlimited"
      ? data.stockMode
      : null;
  const stockMode =
    requestedMode ??
    (inStockValue === false
      ? "limited"
      : Number.isFinite(legacyStockQuantity)
        ? "limited"
        : "unlimited");
  const stockQty =
    stockMode === "limited"
      ? Math.max(
          Number(
            typeof data.stockQty === "number"
              ? data.stockQty
              : Number.isFinite(legacyStockQuantity)
                ? legacyStockQuantity
                : 0,
          ),
          0,
        )
      : undefined;

  return {
    id,
    slug: typeof data.slug === "string" ? data.slug : "",
    name: typeof data.name === "string" ? data.name : "Untitled product",
    description:
      typeof data.description === "string" ? data.description : undefined,
    basePrice,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
    finalPrice,
    category: typeof data.category === "string" ? data.category : "tshirts",
    designTheme:
      typeof data.designTheme === "string" ? data.designTheme : "simple",
    sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
    colors: colorsArray,
    sizeGuideEnabled:
      typeof data.sizeGuideEnabled === "boolean"
        ? data.sizeGuideEnabled
        : false,
    sizeGuideImageUrl:
      typeof data.sizeGuideImageUrl === "string" &&
      data.sizeGuideImageUrl.trim()
        ? data.sizeGuideImageUrl.trim()
        : null,
    sizeGuideImagePublicId:
      typeof data.sizeGuideImagePublicId === "string" &&
      data.sizeGuideImagePublicId.trim()
        ? data.sizeGuideImagePublicId.trim()
        : null,
    gender,
    soldOutSizes: soldOutSizes.length > 0 ? soldOutSizes : undefined,
    soldOutColorCodes:
      soldOutColorCodes.length > 0 ? soldOutColorCodes : undefined,
    stockMode,
    stockQty,
    inStock: stockMode === "limited" ? (stockQty ?? 0) > 0 : true,
    images: imagesValue,
    imageColorAssignments: normalizeImageColorAssignments(data.imageColorAssignments, [
      imagesValue.main,
      ...imagesValue.gallery,
    ]),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    featuredDrops: parseStringArray(data.featuredDrops),
    status:
      typeof data.status === "string" && data.status.trim()
        ? (data.status as StorefrontProductStatus)
        : "active",
  };
}

async function fetchStorefrontProductsByConstraints(
  constraints: QueryConstraint[],
): Promise<StorefrontProduct[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(query(productsRef, ...constraints));
    return snapshot.docs
      .map((doc) => normalizeProduct(doc.data(), doc.id))
      .filter((product) => product.status === "active");
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(
        "Firestore permission denied while reading filtered storefront products; returning empty list.",
      );
    } else {
      console.error(
        "Failed to fetch filtered storefront products from Firestore:",
        error,
      );
    }
    return [];
  }
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "permission-denied";
}

function cursorFromDoc(doc: { id: string }): StorefrontProductsCursor {
  return { id: doc.id };
}

function clampPageSize(value: number | undefined, fallback = 8): number {
  const parsed = Number(value ?? fallback);
  return Math.min(
    Math.max(Math.floor(Number.isFinite(parsed) ? parsed : fallback), 1),
    48,
  );
}

export async function fetchStorefrontProductsByFeaturedDrop({
  slug,
  pageSize = 4,
}: {
  slug: string;
  pageSize?: number;
}): Promise<StorefrontProduct[]> {
  if (!isFirebaseConfigured()) {
    console.warn(
      "Firebase env vars are missing; returning an empty featured drop product list.",
    );
    return [];
  }

  const safeSlug = slug.trim();
  if (!safeSlug) return [];
  const safeLimit = clampPageSize(pageSize, 4);

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(
      query(
        productsRef,
        where("status", "==", "active"),
        where("featuredDrops", "array-contains", safeSlug),
        limit(safeLimit),
      ),
    );
    return snapshot.docs
      .map((doc) => normalizeProduct(doc.data(), doc.id))
      .filter(
        (product) =>
          product.status === "active" &&
          (product.featuredDrops ?? []).includes(safeSlug),
      );
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(
        "Firestore permission denied while reading featured drop products; returning empty list.",
      );
    } else {
      console.error(
        "Failed to fetch featured drop products from Firestore, returning empty list:",
        error,
      );
    }
    return [];
  }
}

export async function fetchStorefrontProductsByIds(
  productIds: string[],
): Promise<StorefrontProduct[]> {
  if (!isFirebaseConfigured()) {
    console.warn(
      "Firebase env vars are missing; returning an empty selected product list.",
    );
    return [];
  }

  const uniqueIds = Array.from(
    new Set(productIds.map((id) => id.trim()).filter(Boolean)),
  );
  if (uniqueIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let index = 0; index < uniqueIds.length; index += 10) {
    chunks.push(uniqueIds.slice(index, index + 10));
  }

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        getDocs(
          query(
            productsRef,
            where("status", "==", "active"),
            where(documentId(), "in", chunk),
          ),
        ),
      ),
    );
    const products = snapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => normalizeProduct(doc.data(), doc.id)),
    );
    return products.filter((product) => product.status === "active");
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(
        "Firestore permission denied while reading selected storefront products; returning empty list.",
      );
    } else {
      console.error(
        "Failed to fetch selected storefront products from Firestore, returning empty list:",
        error,
      );
    }
    return [];
  }
}

export async function fetchStorefrontProductsPage({
  pageSize,
  cursor,
  category,
  designTheme,
}: StorefrontProductsPageParams = {}): Promise<StorefrontProductsPage> {
  if (!isFirebaseConfigured()) {
    console.warn(
      "Firebase env vars are missing; returning an empty product list.",
    );
    return { products: [], nextCursor: null };
  }

  const safeLimit = clampPageSize(pageSize);
  const constraints: QueryConstraint[] = [where("status", "==", "active")];
  if (category && category !== "all")
    constraints.push(where("category", "==", category));
  if (designTheme && designTheme !== "all")
    constraints.push(where("designTheme", "==", designTheme));
  constraints.push(orderBy(documentId()));
  if (cursor) {
    constraints.push(startAfter(cursor.id));
  }
  constraints.push(limit(safeLimit));

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(query(productsRef, ...constraints));
    return {
      products: snapshot.docs
        .map((doc) => normalizeProduct(doc.data(), doc.id))
        .filter((product) => product.status === "active"),
      nextCursor:
        snapshot.docs.length === safeLimit
          ? cursorFromDoc(snapshot.docs[snapshot.docs.length - 1])
          : null,
    };
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(
        "Firestore permission denied while reading storefront products; returning empty list.",
      );
    } else {
      console.error(
        "Failed to fetch storefront products from Firestore, returning empty list:",
        error,
      );
    }
    return { products: [], nextCursor: null };
  }
}

type StorefrontFilterProductsParams = {
  categories?: SelectableItem[];
  designThemes?: SelectableItem[];
};

const FILTER_PRODUCT_SCAN_LIMIT = 200;
const MAX_FILTER_COMBO_PROBES = 120;

function selectableSlugs(items: SelectableItem[] | undefined): string[] {
  return Array.from(
    new Set(
      (items ?? [])
        .map((item) => item.slug?.trim().toLowerCase())
        .filter((slug): slug is string => Boolean(slug)),
    ),
  );
}

function mapFilterDoc(data: DocumentData): StorefrontFilterProduct {
  return {
    category: typeof data.category === "string" ? data.category : "tshirts",
    designTheme:
      typeof data.designTheme === "string" ? data.designTheme : "simple",
    status: "active",
  };
}

export async function fetchStorefrontFilterProducts({
  categories,
  designThemes,
}: StorefrontFilterProductsParams = {}): Promise<StorefrontFilterProduct[]> {
  if (!isFirebaseConfigured()) {
    console.warn(
      "Firebase env vars are missing; returning an empty filter product list.",
    );
    return [];
  }

  const categorySlugs = selectableSlugs(categories);
  const designSlugs = selectableSlugs(designThemes);
  const canProbeKnownCombinations =
    categorySlugs.length > 0 &&
    designSlugs.length > 0 &&
    categorySlugs.length * designSlugs.length <= MAX_FILTER_COMBO_PROBES;

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");

    if (canProbeKnownCombinations) {
      const comboSnapshots = await Promise.all(
        categorySlugs.flatMap((category) =>
          designSlugs.map(async (designTheme) => {
            const snapshot = await getDocs(
              query(
                productsRef,
                where("status", "==", "active"),
                where("category", "==", category),
                where("designTheme", "==", designTheme),
                limit(1),
              ),
            );
            return snapshot.empty
              ? null
              : { category, designTheme, status: "active" as const };
          }),
        ),
      );

      return comboSnapshots.filter(
        (product): product is StorefrontFilterProduct => Boolean(product),
      );
    }

    const snapshot = await getDocs(
      query(
        productsRef,
        where("status", "==", "active"),
        orderBy(documentId()),
        limit(FILTER_PRODUCT_SCAN_LIMIT),
      ),
    );
    return snapshot.docs.map((doc) => mapFilterDoc(doc.data()));
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(
        "Firestore permission denied while reading storefront filter products; returning empty list.",
      );
    } else {
      console.error(
        "Failed to fetch storefront filter products from Firestore, returning empty list:",
        error,
      );
    }
    return [];
  }
}

export async function fetchAllStorefrontProducts(): Promise<
  StorefrontProduct[]
> {
  if (!isFirebaseConfigured()) {
    console.warn(
      "Firebase env vars are missing; returning an empty product list.",
    );
    return [];
  }

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(
      query(
        productsRef,
        where("status", "==", "active"),
        orderBy(documentId()),
      ),
    );
    return snapshot.docs
      .map((doc) => normalizeProduct(doc.data(), doc.id))
      .filter((product) => product.status === "active");
  } catch (error) {
    if (isPermissionDenied(error)) {
      console.warn(
        "Firestore permission denied while reading storefront products; returning empty list.",
      );
    } else {
      console.error(
        "Failed to fetch storefront products from Firestore, returning empty list:",
        error,
      );
    }
    return [];
  }
}

export async function fetchStorefrontProductBySlug(
  slug: string,
): Promise<StorefrontProduct | null> {
  if (!isFirebaseConfigured()) {
    console.warn(
      "Firebase env vars are missing; unable to fetch product by slug.",
    );
    return null;
  }

  try {
    const db = getServerDb();
    const productsRef = collection(db, "products");
    const constraints: QueryConstraint[] = [
      where("slug", "==", slug),
      where("status", "==", "active"),
      limit(1),
    ];
    const snapshot = await getDocs(query(productsRef, ...constraints));
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const product = normalizeProduct(doc.data(), doc.id);
    return product.status === "active" ? product : null;
  } catch (error) {
    console.error(
      `Failed to fetch product by slug "${slug}" from Firestore:`,
      error,
    );
    return null;
  }
}

export async function fetchSuggestedStorefrontProducts(params: {
  currentSlug: string;
  category?: string;
  designTheme?: string;
  limitCount?: number;
}): Promise<StorefrontProduct[]> {
  const { currentSlug, category, designTheme, limitCount = 8 } = params;
  const target = Math.min(Math.max(limitCount, 4), 8);

  const seen = new Set<string>([currentSlug]);
  const suggestions: StorefrontProduct[] = [];

  const appendUnique = (items: StorefrontProduct[]) => {
    for (const item of items) {
      if (seen.has(item.slug)) continue;
      seen.add(item.slug);
      suggestions.push(item);
      if (suggestions.length >= target) break;
    }
  };

  if (category) {
    const byCategory = await fetchStorefrontProductsByConstraints([
      where("category", "==", category),
      where("status", "==", "active"),
      limit(target + 1),
    ]);
    appendUnique(byCategory);
  }

  if (suggestions.length < target && designTheme) {
    const byTheme = await fetchStorefrontProductsByConstraints([
      where("designTheme", "==", designTheme),
      where("status", "==", "active"),
      limit(target + 1),
    ]);
    appendUnique(byTheme);
  }

  if (suggestions.length < target) {
    const fallback = await fetchStorefrontProductsByConstraints([
      where("status", "==", "active"),
      limit(target * 2),
    ]);
    appendUnique(fallback);
  }

  return suggestions.slice(0, target);
}
