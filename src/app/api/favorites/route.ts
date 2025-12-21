import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminResources } from "@/lib/firebaseAdmin";
import type { FavoriteDocument, FavoriteItem } from "@/types/favorites";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function buildAuthError() {
  return jsonError("Authentication required.", 401);
}

function parseAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") return null;
  return token;
}

async function authenticate(request: NextRequest) {
  const resources = getAdminResources();
  if (!resources) return null;
  const token = parseAuthHeader(request);
  if (!token) return null;
  try {
    return await resources.auth.verifyIdToken(token);
  } catch {
    return null;
  }
}

function sortItems(items: FavoriteItem[]): FavoriteItem[] {
  return [...items].sort((a, b) => {
    const aTime = new Date((a as { addedAt: unknown }).addedAt as string).getTime() || 0;
    const bTime = new Date((b as { addedAt: unknown }).addedAt as string).getTime() || 0;
    return bTime - aTime;
  });
}

export async function GET(request: NextRequest) {
  const resources = getAdminResources();
  if (!resources) {
    return jsonError("Server misconfiguration.", 500);
  }
  const { db } = resources;

  const decoded = await authenticate(request);
  if (!decoded) {
    return NextResponse.json({ items: [] });
  }

  try {
    const ref = db.collection("favorites").doc(decoded.uid);
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      await ref.set({
        uid: decoded.uid,
        email: decoded.email ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        items: [],
      });
      return NextResponse.json({ items: [] });
    }
    const data = docSnap.data() as FavoriteDocument;
    return NextResponse.json({ items: sortItems(data.items ?? []) });
  } catch (error) {
    console.error("[favorites][GET] Failed to load favorites", error);
    return jsonError("Failed to load favorites", 500);
  }
}

export async function POST(request: NextRequest) {
  const resources = getAdminResources();
  if (!resources) {
    return jsonError("Server misconfiguration.", 500);
  }
  const { db, auth } = resources;

  const decoded = await authenticate(request);
  if (!decoded) {
    return buildAuthError();
  }

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const image = typeof body?.image === "string" ? body.image : "";
  const price = typeof body?.price === "number" ? body.price : Number(body?.price ?? 0);
  const currency = typeof body?.currency === "string" ? body.currency : "";
  const inStock = typeof body?.inStock === "boolean" ? body.inStock : false;

  if (!productId || !slug || !name || !currency) {
    return jsonError("Invalid payload.", 400);
  }

  try {
    // ensure token still valid (avoid TS error about auth on null)
    await auth.getUser(decoded.uid);
    const favoritesRef = db.collection("favorites").doc(decoded.uid);
    await db.runTransaction(async (tx) => {
      const docSnap = await tx.get(favoritesRef);
      const docTime = FieldValue.serverTimestamp();

      const newItem: FavoriteItem = {
        id: productId,
        productId,
        slug,
        name,
        image,
        price,
        currency,
        inStock,
        addedAt: Timestamp.now(),
      };

      if (!docSnap.exists) {
        tx.set(
          favoritesRef,
          {
            uid: decoded.uid ?? null,
            email: decoded.email ?? null,
            createdAt: docTime,
            updatedAt: docTime,
            items: [newItem],
          } satisfies Omit<FavoriteDocument, "id">,
        );
        return;
      }

      const data = docSnap.data() as FavoriteDocument;
      const currentItems = data.items ?? [];
      const exists = currentItems.some((item) => item.productId === productId || item.id === productId);

      const nextItems = exists
        ? currentItems.filter((item) => (item.productId ?? item.id) !== productId)
        : [...currentItems, newItem];

      tx.update(favoritesRef, {
        items: nextItems,
        updatedAt: docTime,
      });
    });

    const updatedSnap = await favoritesRef.get();
    const updatedData = updatedSnap.data() as FavoriteDocument | undefined;
    return NextResponse.json({ items: sortItems(updatedData?.items ?? []) });
  } catch (error) {
    console.error("[favorites][POST] Failed to update favorites", error);
    return jsonError("Failed to update favorites", 500);
  }
}
