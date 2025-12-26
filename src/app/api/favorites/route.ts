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

type NormalizedFavoritePayload = {
  item: FavoriteItem & { productId: string };
  productId: string;
};

function normalizeFavoritePayload(payload: Record<string, unknown>): NormalizedFavoritePayload | null {
  const productId = typeof payload?.productId === "string" ? payload.productId.trim() : "";
  const slug = typeof payload?.slug === "string" ? payload.slug.trim() : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const image = typeof payload?.image === "string" ? payload.image : "";
  const price = typeof payload?.price === "number" ? payload.price : Number(payload?.price ?? 0);
  const currency = typeof payload?.currency === "string" ? payload.currency : "";
  const inStock = typeof payload?.inStock === "boolean" ? payload.inStock : false;
  const addedAt = typeof payload?.addedAt === "string" ? payload.addedAt : null;

  if (!productId || !slug || !name || !currency) return null;

  const nowIso = Timestamp.now().toDate().toISOString();
  return {
    item: {
      id: productId,
      productId,
      slug,
      name,
      image,
      price,
      currency,
      inStock,
      addedAt: addedAt ?? nowIso,
    },
    productId,
  };
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
    const docSnap = await db.collection("favorites").doc(decoded.uid).get();
    if (!docSnap.exists) {
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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const normalized = body ? normalizeFavoritePayload(body) : null;

  if (!normalized) {
    return jsonError("Invalid payload.", 400);
  }

  try {
    // ensure token still valid (avoid TS error about auth on null)
    await auth.getUser(decoded.uid);
    const favoritesRef = db.collection("favorites").doc(decoded.uid);

    await db.runTransaction(async (tx) => {
      const docSnap = await tx.get(favoritesRef);
      const docTime = FieldValue.serverTimestamp();
      const newItem = normalized.item;
      const productId = normalized.productId;

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
        ? currentItems.filter((item) => item.productId !== productId)
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

export async function PUT(request: NextRequest) {
  const resources = getAdminResources();
  if (!resources) {
    return jsonError("Server misconfiguration.", 500);
  }
  const { db, auth } = resources;

  const decoded = await authenticate(request);
  if (!decoded) {
    return buildAuthError();
  }

  const body = (await request.json().catch(() => null)) as { items?: unknown } | null;
  const incoming = Array.isArray(body?.items) ? body?.items : [];
  const normalizedItems = incoming
    .map((entry) =>
      entry && typeof entry === "object"
        ? normalizeFavoritePayload(entry as Record<string, unknown>)
        : null,
    )
    .filter((entry): entry is NormalizedFavoritePayload => Boolean(entry));

  try {
    await auth.getUser(decoded.uid);
    const favoritesRef = db.collection("favorites").doc(decoded.uid);

    await db.runTransaction(async (tx) => {
      const docSnap = await tx.get(favoritesRef);
      const docTime = FieldValue.serverTimestamp();
      const newItems = normalizedItems.map((entry) => entry.item);

      if (!docSnap.exists) {
        tx.set(
          favoritesRef,
          {
            uid: decoded.uid ?? null,
            email: decoded.email ?? null,
            createdAt: docTime,
            updatedAt: docTime,
            items: newItems,
          } satisfies Omit<FavoriteDocument, "id">,
        );
        return;
      }

      const data = docSnap.data() as FavoriteDocument;
      const currentItems = data.items ?? [];
      const merged = [...currentItems];
      newItems.forEach((item) => {
        const exists = merged.some((existing) => existing.productId === item.productId || existing.id === item.id);
        if (!exists) {
          merged.push(item);
        }
      });

      tx.update(favoritesRef, {
        items: merged,
        updatedAt: docTime,
      });
    });

    const updatedSnap = await favoritesRef.get();
    const updatedData = updatedSnap.data() as FavoriteDocument | undefined;
    return NextResponse.json({ items: sortItems(updatedData?.items ?? []) });
  } catch (error) {
    console.error("[favorites][PUT] Failed to merge favorites", error);
    return jsonError("Failed to merge favorites", 500);
  }
}
