import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";

import { getAdminResources } from "@/lib/firebaseAdmin";
import type { FavoriteDocument, FavoriteItem, FavoriteItemFirestore } from "@/types/favorites";

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

async function requireAuth(request: NextRequest, auth: ReturnType<typeof getAdminResources>["auth"]) {
  const bearerToken = parseBearerToken(request);
  if (!bearerToken) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  try {
    const decoded = await auth.verifyIdToken(bearerToken);
    return { decoded };
  } catch (error) {
    console.error("[api/favorites] Token verification failed", error);
    return { error: NextResponse.json({ error: "Invalid token." }, { status: 401 }) };
  }
}

function timestampToISO(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value) return (value as Timestamp).toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function normalizeItem(raw: DocumentData): FavoriteItem {
  const colorName = typeof raw.colorName === "string" ? raw.colorName : undefined;
  const colorCode = typeof raw.colorCode === "string" ? raw.colorCode : undefined;
  const size = typeof raw.size === "string" ? raw.size : undefined;
  return {
    productId: String(raw.productId ?? ""),
    slug: String(raw.slug ?? ""),
    name: String(raw.name ?? ""),
    image: String(raw.image ?? ""),
    price: typeof raw.price === "number" ? raw.price : Number(raw.price ?? 0),
    currency: typeof raw.currency === "string" ? raw.currency : "DZD",
    colorName,
    colorCode,
    size,
    variantKey: typeof raw.variantKey === "string" ? raw.variantKey : "",
    addedAt: timestampToISO(raw.addedAt),
  };
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)) as T;
}

function resolveOwnerId(decoded: { uid?: string | null; email?: string | null }) {
  const uid = decoded.uid?.trim();
  const email = decoded.email?.trim().toLowerCase();
  return uid ?? email ?? null;
}

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
    if ("error" in authResult) {
      return authResult.error;
    }

    const ownerId = resolveOwnerId(authResult.decoded);

    if (!ownerId) {
      return NextResponse.json({ error: "Missing user identifier." }, { status: 400 });
    }

    const favoritesCollection = db.collection("favorites");
    let doc = await favoritesCollection.doc(ownerId).get();

    if (!doc.exists) {
      const fallbackId = authResult.decoded?.email?.trim().toLowerCase();
      if (fallbackId && fallbackId !== ownerId) {
        const emailDoc = await favoritesCollection.doc(fallbackId).get();
        if (emailDoc.exists) {
          doc = emailDoc;
        }
      }
    }

    if (!doc.exists) {
      return NextResponse.json({ items: [] });
    }

    const data = doc.data() as FavoriteDocument & { items?: FavoriteItemFirestore[] } | undefined;
    const items = Array.isArray(data?.items) ? data.items.map((item) => normalizeItem(item)) : [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/favorites] GET error", error);
    return NextResponse.json({ error: "Failed to load favorites." }, { status: 500 });
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
    if ("error" in authResult) {
      return authResult.error;
    }

    const body = (await request.json()) as Record<string, unknown>;
    const ownerId = resolveOwnerId(authResult.decoded);
    const ownerEmail = authResult.decoded?.email?.trim().toLowerCase() ?? null;
    if (!ownerId) {
      return NextResponse.json({ error: "Authentication required to manage favorites." }, { status: 401 });
    }

    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const price = typeof body.price === "number" ? body.price : Number(body.price ?? 0);
    const currency = typeof body.currency === "string" ? body.currency.trim() : "";
    const colorName = typeof body.colorName === "string" ? body.colorName.trim() : "";
    const colorCode = typeof body.colorCode === "string" ? body.colorCode.trim() : "";
    const size = typeof body.size === "string" ? body.size.trim() : "";
    const variantKey = typeof body.variantKey === "string" ? body.variantKey.trim().toLowerCase() : "";

    if (!productId || !slug || !name || !image || !currency || !variantKey) {
      return NextResponse.json({ error: "Invalid favorite payload." }, { status: 400 });
    }

    const favoritesCollection = db.collection("favorites");
    let targetId = ownerId;
    if (ownerEmail && ownerEmail !== ownerId) {
      const [uidDoc, emailDoc] = await Promise.all([
        favoritesCollection.doc(ownerId).get(),
        favoritesCollection.doc(ownerEmail).get(),
      ]);
      if (!uidDoc.exists && emailDoc.exists) {
        targetId = ownerEmail;
      }
    }

    const favoritesRef = favoritesCollection.doc(targetId);

    let resultStatus: "added" | "removed" = "added";
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(favoritesRef);
      const baseItem: FavoriteItemFirestore = clean({
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
        addedAt: Timestamp.now(), // serverTimestamp not allowed in array values
      });

      if (!snapshot.exists) {
        const newDoc: FavoriteDocument & { items: FavoriteItemFirestore[] } = {
          userId: ownerId,
          email: ownerEmail,
          createdAt: FieldValue.serverTimestamp() as unknown as string,
          updatedAt: FieldValue.serverTimestamp() as unknown as string,
          items: [baseItem],
        };
        transaction.set(favoritesRef, newDoc);
        resultStatus = "added";
        return;
      }

      const data = snapshot.data() as { items?: FavoriteItemFirestore[]; userId?: string | null; email?: string | null };
      const existingItems = Array.isArray(data?.items) ? data.items : [];
      const alreadyExists = existingItems.some(
        (item) => item.productId === productId && (item.variantKey ?? "").toLowerCase() === variantKey,
      );

      const nextItems = alreadyExists
        ? existingItems.filter((item) => !(item.productId === productId && (item.variantKey ?? "").toLowerCase() === variantKey))
        : [...existingItems, baseItem];

      resultStatus = alreadyExists ? "removed" : "added";
      transaction.update(favoritesRef, {
        items: nextItems.map((item) => clean(item)),
        updatedAt: FieldValue.serverTimestamp(),
        userId: data?.userId ?? ownerId,
        email: data?.email ?? ownerEmail,
      });
    });

    const updatedSnapshot = await favoritesRef.get();
    const updatedData = updatedSnapshot.data() as { items?: FavoriteItemFirestore[] } | undefined;
    const favorites = Array.isArray(updatedData?.items) ? updatedData.items.map((item) => normalizeItem(item)) : [];

    return NextResponse.json({ status: resultStatus, favorites });
  } catch (error) {
    console.error("[api/favorites] POST error", error);
    return NextResponse.json({ error: "Failed to update favorites." }, { status: 500 });
  }
}
