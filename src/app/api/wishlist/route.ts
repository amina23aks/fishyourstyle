import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

import { getAdminResources } from "@/lib/firebaseAdmin";
import type { WishlistDocument, WishlistItem } from "@/types/wishlist";

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

async function requireAuth(
  request: NextRequest,
  auth: ReturnType<typeof getAuth>,
): Promise<NextResponse<{ error: string }> | DecodedIdToken> {
  const bearerToken = parseBearerToken(request);
  if (!bearerToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const decoded = await auth.verifyIdToken(bearerToken);
    return decoded;
  } catch (error) {
    console.error("[api/wishlist] Token verification failed", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

function timestampToISO(timestamp: unknown): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  if (
    typeof timestamp === "object" &&
    timestamp &&
    ("_seconds" in timestamp || "seconds" in timestamp) &&
    ("_nanoseconds" in timestamp || "nanoseconds" in timestamp)
  ) {
    const seconds =
      (timestamp as { _seconds?: number; seconds?: number })._seconds ??
      (timestamp as { _seconds?: number; seconds?: number }).seconds ??
      0;
    const nanos =
      (timestamp as { _nanoseconds?: number; nanoseconds?: number })._nanoseconds ??
      (timestamp as { _nanoseconds?: number; nanoseconds?: number }).nanoseconds ??
      0;
    const date = new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  if (typeof timestamp === "string") {
    return timestamp;
  }
  return new Date().toISOString();
}

function normalizeVariantKey(
  productId: string,
  variantKey?: string,
  colorName?: string,
  size?: string,
): string {
  const trimmedKey = typeof variantKey === "string" ? variantKey.trim() : "";
  if (trimmedKey) return trimmedKey.toLowerCase();
  const color = (colorName ?? "").trim().toLowerCase();
  const normalizedSize = (size ?? "").trim().toLowerCase();
  if (color || normalizedSize) {
    return `${productId}-${color}-${normalizedSize}`.toLowerCase();
  }
  return productId.toLowerCase();
}

function serializeWishlistItems(items: unknown[]): WishlistItem[] {
  return items
    .filter(Boolean)
    .map((item) => item as DocumentData)
    .map((item) => {
      const productId = typeof item.productId === "string" ? item.productId : "";
      const slug = typeof item.slug === "string" ? item.slug : "";
      const name = typeof item.name === "string" ? item.name : "";
      const image = typeof item.image === "string" ? item.image : "";
      const price = typeof item.price === "number" ? item.price : Number(item.price ?? 0);
      const currency = typeof item.currency === "string" ? item.currency : "DZD";
      const colorName = typeof item.colorName === "string" ? item.colorName : undefined;
      const colorCode = typeof item.colorCode === "string" ? item.colorCode : undefined;
      const size = typeof item.size === "string" ? item.size : undefined;
      const variantKey = typeof item.variantKey === "string" ? item.variantKey : undefined;
      const addedAt = timestampToISO(item.addedAt);

      return {
        productId,
        slug,
        name,
        image,
        price,
        currency,
        colorName,
        colorCode,
        size,
        variantKey,
        addedAt,
      };
    })
    .filter((item) => item.productId && item.slug && item.name);
}

function isSameWishlistItem(
  existing: WishlistItem | DocumentData,
  ident: { productId: string; variantKey?: string; colorName?: string; size?: string },
): boolean {
  const existingKey = normalizeVariantKey(
    typeof existing.productId === "string" ? existing.productId : "",
    typeof existing.variantKey === "string" ? existing.variantKey : undefined,
    typeof existing.colorName === "string" ? existing.colorName : undefined,
    typeof existing.size === "string" ? existing.size : undefined,
  );
  const targetKey = normalizeVariantKey(
    ident.productId,
    ident.variantKey,
    ident.colorName,
    ident.size,
  );

  return existingKey === targetKey;
}

type FirestoreTimestampValue = Timestamp | FieldValue | string;

type WishlistFirestoreItem = Omit<WishlistItem, "addedAt"> & { addedAt: FirestoreTimestampValue };

type WishlistFirestoreDocument = Omit<WishlistDocument, "createdAt" | "updatedAt" | "items"> & {
  createdAt: FirestoreTimestampValue;
  updatedAt: FirestoreTimestampValue;
  items: WishlistFirestoreItem[];
};

export async function GET(request: NextRequest) {
  try {
    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;

    const authResult = await requireAuth(request, auth);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const wishlistDoc = await db.collection("wishlist").doc(authResult.uid).get();
    if (!wishlistDoc.exists) {
      return NextResponse.json({ items: [] satisfies WishlistItem[] });
    }

    const data = wishlistDoc.data() as WishlistFirestoreDocument | undefined;
    const items = serializeWishlistItems(data?.items ?? []);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/wishlist] GET error", error);
    return NextResponse.json({ error: "Failed to load wishlist." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;

    const authResult = await requireAuth(request, auth);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = (await request.json()) as Record<string, unknown>;
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const price = typeof body.price === "number" ? body.price : Number(body.price ?? 0);
    const currency = typeof body.currency === "string" ? body.currency : "";
    const colorName = typeof body.colorName === "string" ? body.colorName.trim() : undefined;
    const colorCode = typeof body.colorCode === "string" ? body.colorCode.trim() : undefined;
    const size = typeof body.size === "string" ? body.size.trim() : undefined;
    const variantKeyRaw = typeof body.variantKey === "string" ? body.variantKey.trim() : undefined;

    if (!productId || !slug || !name || !image || !currency || !Number.isFinite(price)) {
      return NextResponse.json({ error: "Invalid wishlist payload." }, { status: 400 });
    }

    const computedVariantKey = normalizeVariantKey(productId, variantKeyRaw, colorName, size);
    const wishlistRef = db.collection("wishlist").doc(authResult.uid);

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(wishlistRef);
      const baseItem: WishlistFirestoreItem = {
        productId,
        slug,
        name,
        image,
        price,
        currency,
        colorName,
        colorCode,
        size,
        variantKey: computedVariantKey,
        addedAt: FieldValue.serverTimestamp(),
      };

      if (!snapshot.exists) {
        const newDoc: WishlistFirestoreDocument = {
          userId: authResult.uid ?? null,
          email: authResult.email ?? "",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          items: [baseItem],
        };
        transaction.set(wishlistRef, newDoc);
        return;
      }

      const data = snapshot.data() as WishlistFirestoreDocument | undefined;
      const existingItems = Array.isArray(data?.items) ? data.items : [];
      const alreadyExists = existingItems.some((item) =>
        isSameWishlistItem(item, { productId, variantKey: computedVariantKey, colorName, size }),
      );

      if (alreadyExists) {
        transaction.update(wishlistRef, { updatedAt: FieldValue.serverTimestamp() });
        return;
      }

      const nextItems = [...existingItems, baseItem];
      transaction.update(wishlistRef, {
        items: nextItems,
        updatedAt: FieldValue.serverTimestamp(),
        email: data?.email ?? authResult.email ?? "",
        userId: data?.userId ?? authResult.uid ?? null,
      });
    });

    const updatedSnapshot = await wishlistRef.get();
    const updatedData = updatedSnapshot.data() as WishlistFirestoreDocument | undefined;
    const items = serializeWishlistItems(updatedData?.items ?? []);

    console.log("[api/wishlist] Added wishlist item", {
      userId: authResult.uid,
      productId,
      variantKey: computedVariantKey,
      totalItems: items.length,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/wishlist] POST error", error);
    return NextResponse.json({ error: "Failed to update wishlist." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminResources = getAdminResources();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;

    const authResult = await requireAuth(request, auth);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = (await request.json()) as Record<string, unknown>;
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const colorName = typeof body.colorName === "string" ? body.colorName.trim() : undefined;
    const size = typeof body.size === "string" ? body.size.trim() : undefined;
    const variantKeyRaw = typeof body.variantKey === "string" ? body.variantKey.trim() : undefined;
    const computedVariantKey = normalizeVariantKey(productId, variantKeyRaw, colorName, size);

    if (!productId) {
      return NextResponse.json({ error: "productId is required to remove wishlist items." }, { status: 400 });
    }

    const wishlistRef = db.collection("wishlist").doc(authResult.uid);
    const snapshot = await wishlistRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ items: [] satisfies WishlistItem[] });
    }

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(wishlistRef);
      const data = doc.data() as WishlistFirestoreDocument | undefined;
      const existingItems = Array.isArray(data?.items) ? data.items : [];

      const filtered = existingItems.filter(
        (item) =>
          !isSameWishlistItem(item, {
            productId,
            variantKey: computedVariantKey,
            colorName,
            size,
          }),
      );

      transaction.update(wishlistRef, {
        items: filtered,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const updatedSnapshot = await wishlistRef.get();
    const updatedData = updatedSnapshot.data() as WishlistFirestoreDocument | undefined;
    const items = serializeWishlistItems(updatedData?.items ?? []);

    console.log("[api/wishlist] Removed wishlist item", {
      userId: authResult.uid,
      productId,
      variantKey: computedVariantKey,
      totalItems: items.length,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/wishlist] DELETE error", error);
    return NextResponse.json({ error: "Failed to remove wishlist item." }, { status: 500 });
  }
}
