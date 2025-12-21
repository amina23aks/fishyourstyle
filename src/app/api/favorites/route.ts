import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminResources } from "@/lib/firebaseAdmin";
import type { FavoriteItem, UserFavoritesDoc } from "@/types/favorites";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function authenticate(request: NextRequest): Promise<DecodedIdToken | null> {
  const resources = getAdminResources();
  if (!resources) return null;

  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") return null;

  try {
    const decoded = await resources.auth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

function serializeItems(items: UserFavoritesDoc["items"]): FavoriteItem[] {
  return items
    .map((item) => ({
      ...item,
      addedAt: item.addedAt,
    }))
    .sort((a, b) => {
      const aTime = typeof a.addedAt?.toMillis === "function" ? a.addedAt.toMillis() : 0;
      const bTime = typeof b.addedAt?.toMillis === "function" ? b.addedAt.toMillis() : 0;
      return bTime - aTime;
    });
}

export async function GET(request: NextRequest) {
  const resources = getAdminResources();
  if (!resources) {
    return jsonError("Authentication required", 401);
  }

  const decoded = await authenticate(request);
  if (!decoded) {
    return jsonError("Authentication required", 401);
  }

  try {
    const docRef = resources.db.collection("favorites").doc(decoded.uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ items: [] });
    }

    const data = docSnap.data() as UserFavoritesDoc;
    const items = serializeItems(data.items ?? []);

    return NextResponse.json({
      email: data.email ?? null,
      items,
    });
  } catch (error) {
    console.error("[favorites][GET] Failed to load favorites", error);
    return jsonError("Failed to load favorites", 500);
  }
}

export async function POST(request: NextRequest) {
  const resources = getAdminResources();
  if (!resources) {
    return jsonError("Authentication required", 401);
  }

  const decoded = await authenticate(request);
  if (!decoded) {
    return jsonError("Authentication required", 401);
  }

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
  if (!productId) {
    return jsonError("Product ID is required.", 400);
  }

  try {
    const productRef = resources.db.collection("products").doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return jsonError("Product not found", 404);
    }

    const product = productSnap.data() ?? {};
    const item = {
      productId,
      slug: typeof product.slug === "string" ? product.slug : "",
      name: typeof product.name === "string" ? product.name : product.nameFr ?? "Product",
      image:
        (product.images && typeof product.images === "object" && typeof product.images.main === "string"
          ? product.images.main
          : product.images?.gallery?.[0]) ?? "",
      price:
        typeof product.finalPrice === "number"
          ? product.finalPrice
          : typeof product.price === "number"
            ? product.price
            : typeof product.priceDzd === "number"
              ? product.priceDzd
              : typeof product.basePrice === "number"
                ? product.basePrice
                : 0,
      currency: "DZD" as const,
      inStock:
        typeof product.inStock === "boolean"
          ? product.inStock
          : typeof product.stock === "number"
            ? product.stock > 0
            : true,
      addedAt: FieldValue.serverTimestamp() as unknown as FavoriteItem["addedAt"],
    } satisfies FavoriteItem;

    const favoritesRef = resources.db.collection("favorites").doc(decoded.uid);

    await resources.db.runTransaction(async (tx) => {
      const docSnap = await tx.get(favoritesRef);
      const now = FieldValue.serverTimestamp();

      if (!docSnap.exists) {
        tx.set(favoritesRef, {
          email: decoded.email ?? null,
          items: [item],
          createdAt: now,
          updatedAt: now,
        });
        return;
      }

      const data = docSnap.data() as UserFavoritesDoc;
      const currentItems = data.items ?? [];
      const exists = currentItems.some((entry) => entry.productId === productId);

      const nextItems = exists
        ? currentItems.filter((entry) => entry.productId !== productId)
        : [...currentItems, item];

      tx.update(favoritesRef, {
        items: nextItems,
        updatedAt: now,
      });
    });

    const updatedSnap = await favoritesRef.get();
    const updatedData = updatedSnap.data() as UserFavoritesDoc | undefined;
    const items = serializeItems(updatedData?.items ?? []);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[favorites][POST] Failed to update favorites", error);
    return jsonError("Failed to update favorites", 500);
  }
}
