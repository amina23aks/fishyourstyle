import { NextRequest, NextResponse } from "next/server";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

import type { NewOrder, Order, OrderStatus, ShippingInfo } from "@/types/order";

const ADMIN_EMAILS = ["fishyourstyle.supp@gmail.com"] as const;

function logEnvDetection() {
  const hasAdminProject = Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID);
  const hasAdminEmail = Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const hasAdminKey = Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const hasLegacyProject = Boolean(process.env.FIREBASE_PROJECT_ID);
  const hasLegacyEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL);
  const hasLegacyKey = Boolean(process.env.FIREBASE_PRIVATE_KEY);

  console.log("[api/orders] Env detection", {
    FIREBASE_ADMIN_PROJECT_ID: hasAdminProject,
    FIREBASE_ADMIN_CLIENT_EMAIL: hasAdminEmail,
    FIREBASE_ADMIN_PRIVATE_KEY: hasAdminKey,
    FIREBASE_PROJECT_ID: hasLegacyProject,
    FIREBASE_CLIENT_EMAIL: hasLegacyEmail,
    FIREBASE_PRIVATE_KEY: hasLegacyKey,
  });
}

function getAdminCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

let adminInitialized = false;

function ensureAdminServices():
  | {
      db: ReturnType<typeof getFirestore>;
      auth: ReturnType<typeof getAuth>;
    }
  | null {
  if (!adminInitialized) {
    logEnvDetection();
  }

  const credentials = getAdminCredentials();
  if (!credentials) {
    console.error("[api/orders] Missing Firebase Admin credentials");
    return null;
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(credentials) });
    console.log("[api/orders] Firebase Admin app initialized");
  } else if (!adminInitialized) {
    console.log("[api/orders] Firebase Admin app already initialized");
  }

  adminInitialized = true;
  const db = getFirestore();
  const auth = getAuth();
  return { db, auth };
}

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

function isAdminUser(decoded: DecodedIdToken | null): boolean {
  if (!decoded?.email) return false;
  const email = decoded.email.toLowerCase();
  return ADMIN_EMAILS.includes(email as (typeof ADMIN_EMAILS)[number]);
}

function requireAuth(
  request: NextRequest,
  auth: ReturnType<typeof getAuth>,
): NextResponse<{ error: string }> | DecodedIdToken {
  const bearerToken = parseBearerToken(request);
  if (!bearerToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    return auth.verifyIdToken(bearerToken);
  } catch (error) {
    console.error("[api/orders] Token verification failed", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

/**
 * Validate NewOrder payload
 */
function validateOrder(data: unknown): data is NewOrder {
  if (!data || typeof data !== "object") return false;

  const order = data as Partial<NewOrder>;

  // Validate items array
  if (!Array.isArray(order.items) || order.items.length === 0) return false;
  for (const item of order.items) {
    if (
      !item.id ||
      !item.slug ||
      !item.name ||
      typeof item.price !== "number" ||
      item.price <= 0 ||
      !item.currency ||
      !item.image ||
      !item.colorName ||
      !item.colorCode ||
      !item.size ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0 ||
      !item.variantKey
    ) {
      return false;
    }
  }

  // Validate shipping info
  if (!order.shipping || typeof order.shipping !== "object") return false;
  const shipping = order.shipping as Partial<ShippingInfo>;
  if (
    !shipping.customerName ||
    !shipping.phone ||
    !shipping.wilaya ||
    !shipping.address ||
    !shipping.mode ||
    typeof shipping.price !== "number" ||
    shipping.price < 0
  ) {
    return false;
  }

  // Validate totals
  if (
    typeof order.subtotal !== "number" ||
    order.subtotal < 0 ||
    typeof order.shippingCost !== "number" ||
    order.shippingCost < 0 ||
    typeof order.total !== "number" ||
    order.total < 0
  ) {
    return false;
  }

  // Validate payment method
  if (order.paymentMethod !== "COD") return false;

  // Validate status
  if (
    order.status !== "pending" &&
    order.status !== "confirmed" &&
    order.status !== "shipped" &&
    order.status !== "delivered" &&
    order.status !== "cancelled"
  ) {
    return false;
  }

  // Customer email is optional but if present should be a string
  if (order.customerEmail !== undefined && typeof order.customerEmail !== "string") {
    return false;
  }

  // Auth user is optional but if present should be a string
  if (order.userId !== undefined && typeof order.userId !== "string") {
    return false;
  }

  return true;
}

/**
 * POST /api/orders
 * Create a new order in Firestore
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!validateOrder(body)) {
      return NextResponse.json(
        { error: "Invalid order data. Please check all required fields." },
        { status: 400 },
      );
    }

    const adminResources = ensureAdminServices();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;

    const { userId: _ignored, ...orderBody } = body as NewOrder;
    void _ignored;

    const bearerToken = parseBearerToken(request);
    let decoded: DecodedIdToken | null = null;
    if (bearerToken) {
      try {
        decoded = await auth.verifyIdToken(bearerToken);
      } catch (error) {
        console.warn("[api/orders] Invalid auth token provided, proceeding as guest.", error);
      }
    }

    const orderToSave: NewOrder = {
      ...(orderBody as NewOrder),
      userId: decoded?.uid ?? undefined,
      status: "pending",
    };

    const orderDataForFirestore = {
      ...orderToSave,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    console.log("[api/orders] Order payload prepared", {
      hasUser: Boolean(orderToSave.userId),
      items: orderToSave.items.length,
    });

    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    const aggregatedQuantities = orderToSave.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = (acc[item.id] ?? 0) + item.quantity;
      return acc;
    }, {});

    let createdOrderId: string | null = null;
    const productSnapshots = new Map<string, DocumentData>();

    await db.runTransaction(async (transaction) => {
      for (const [productId, requestedQty] of Object.entries(aggregatedQuantities)) {
        const productRef = productsCollection.doc(productId);
        const snapshot = await transaction.get(productRef);
        if (!snapshot.exists) {
          throw new Error(`Product not found: ${productId}`);
        }
        const data = snapshot.data();
        if (!data) {
          throw new Error(`Product data missing: ${productId}`);
        }

        productSnapshots.set(productId, data);
        const rawStock = typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0);
        const availableStock = data.inStock === false ? 0 : rawStock;

        if (requestedQty > availableStock) {
          const name = typeof data.name === "string" ? data.name : productId;
          throw new Error(`Insufficient stock for ${name}`);
        }
      }

      for (const [productId, requestedQty] of Object.entries(aggregatedQuantities)) {
        const productRef = productsCollection.doc(productId);
        const data = productSnapshots.get(productId);
        if (!data) continue;
        const rawStock = typeof data.stock === "number" ? data.stock : Number(data.stock ?? 0);
        const nextStock = Math.max(rawStock - requestedQty, 0);
        transaction.update(productRef, { stock: nextStock, inStock: nextStock > 0 });
      }

      const orderRef = ordersCollection.doc();
      createdOrderId = orderRef.id;
      transaction.set(orderRef, orderDataForFirestore);
    });

    if (!createdOrderId) {
      throw new Error("Order ID missing after transaction commit");
    }

    console.log("[api/orders] Order created", { orderId: createdOrderId });

    return NextResponse.json({ orderId: createdOrderId }, { status: 201 });
  } catch (error) {
    console.error("[api/orders] POST error", error);

    if (error instanceof Error) {
      const isStockError =
        error.message.toLowerCase().includes("insufficient stock") ||
        error.message.toLowerCase().includes("product not found");

      return NextResponse.json(
        {
          error: isStockError
            ? "Some items are no longer available. Please review your cart."
            : `Failed to create order: ${error.message}`,
        },
        { status: isStockError ? 400 : 500 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function timestampToISO(timestamp: unknown): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  if (typeof timestamp === "string") {
    return timestamp;
  }
  return new Date().toISOString();
}

function firestoreDocToOrder(docId: string, data: DocumentData): Order {
  return {
    id: docId,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
    items: data.items || [],
    shipping: data.shipping,
    notes: data.notes,
    subtotal: data.subtotal,
    shippingCost: data.shippingCost,
    total: data.total,
    paymentMethod: data.paymentMethod || "COD",
    status: (data.status || "pending") as OrderStatus,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
    cancelledAt: data.cancelledAt ? timestampToISO(data.cancelledAt) : undefined,
  };
}

/**
 * GET /api/orders
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");

    const adminResources = ensureAdminServices();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;
    const ordersCollection = db.collection("orders");

    const bearerToken = parseBearerToken(request);
    const requiresAuth = Boolean(orderId || userId || (!orderId && !userId));
    if (requiresAuth && !bearerToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let decoded: DecodedIdToken | null = null;
    if (bearerToken) {
      try {
        decoded = await auth.verifyIdToken(bearerToken);
      } catch (error) {
        console.error("[api/orders] Token verification failed", error);
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    if (orderId) {
      const orderDoc = ordersCollection.doc(orderId);
      const orderSnapshot = await orderDoc.get();

      if (!orderSnapshot.exists) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const data = orderSnapshot.data();
      if (!data) {
        return NextResponse.json({ error: "Order data missing" }, { status: 500 });
      }

      const ownerId = typeof data.userId === "string" ? data.userId : undefined;
      const authorized = isAdminUser(decoded) || (!!decoded?.uid && ownerId === decoded.uid);
      if (!authorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const orderData = firestoreDocToOrder(orderSnapshot.id, data);
      return NextResponse.json(orderData);
    }

    const orders: Order[] = [];

    if (userId && userId.trim()) {
      const authorized = isAdminUser(decoded) || (!!decoded?.uid && decoded.uid === userId);
      if (!authorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const userOrdersQuery = ordersCollection
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc") as Query<DocumentData>;
      const userOrdersSnapshot = await userOrdersQuery.get();

      userOrdersSnapshot.forEach((snapshotDoc) => {
        const orderData = snapshotDoc.data();
        if (orderData) {
          orders.push(firestoreDocToOrder(snapshotDoc.id, orderData as DocumentData));
        }
      });

      return NextResponse.json(orders);
    }

    if (!isAdminUser(decoded)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ordersQuery = ordersCollection.orderBy("createdAt", "desc") as Query<DocumentData>;
    const ordersSnapshot = await ordersQuery.get();

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        orders.push(firestoreDocToOrder(doc.id, data as DocumentData));
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("[api/orders] GET error", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/orders (cancel)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { orderId, action } = body as { orderId?: string; action?: string };

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required and must be a string" }, { status: 400 });
    }

    if (action !== "cancel") {
      return NextResponse.json({ error: 'Only "cancel" action is supported' }, { status: 400 });
    }

    const adminResources = ensureAdminServices();
    if (!adminResources) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }
    const { db, auth } = adminResources;

    const decoded = requireAuth(request, auth);
    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const ordersCollection = db.collection("orders");
    const orderDoc = ordersCollection.doc(orderId);
    const orderSnapshot = await orderDoc.get();

    if (!orderSnapshot.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnapshot.data();
    if (!orderData) {
      return NextResponse.json({ error: "Order data missing" }, { status: 500 });
    }

    const isOwner = typeof orderData.userId === "string" ? orderData.userId === decoded.uid : false;
    if (!isOwner && !isAdminUser(decoded)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentStatus = orderData.status as OrderStatus;
    if (currentStatus !== "pending") {
      return NextResponse.json(
        { error: `Cannot cancel order with status "${currentStatus}". Only pending orders can be cancelled.` },
        { status: 400 },
      );
    }

    await orderDoc.update({
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updatedSnapshot = await orderDoc.get();
    const updatedData = updatedSnapshot.data();

    if (!updatedData) {
      return NextResponse.json({ error: "Updated order data not found" }, { status: 500 });
    }

    const updatedOrderData = firestoreDocToOrder(updatedSnapshot.id, updatedData);
    return NextResponse.json(updatedOrderData);
  } catch (error) {
    console.error("[api/orders] PATCH error", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
