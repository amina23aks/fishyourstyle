import { NextRequest, NextResponse } from "next/server";
import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import { isFirebaseConfigured } from "@/lib/firebaseConfig";
import type { NewOrder, ShippingInfo, Order, OrderStatus } from "@/types/order";
import { getAdminDb, isAdminConfigured } from "@/lib/firebaseAdmin";

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

    // Validate the request body
    if (!validateOrder(body)) {
      return NextResponse.json(
        { error: "Invalid order data. Please check all required fields." },
        { status: 400 }
      );
    }

    const orderData: NewOrder = body;

    // Ensure status is "pending" for new orders
    const orderToSave: NewOrder = {
      ...orderData,
      status: "pending",
    };

    if (!isFirebaseConfigured() || !isAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase is not configured. Please add your Firebase environment variables." },
        { status: 503 },
      );
    }

    // Get Firestore instance
    console.log("[api/orders] Getting Firestore instance...");
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please check your credentials." },
        { status: 503 },
      );
    }
    console.log("[api/orders] Firestore instance obtained.");

    // Prepare order data for Firestore
    const orderDataForFirestore = {
      ...orderToSave,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    console.log("[api/orders] Order data prepared for Firestore:", {
      itemsCount: orderToSave.items.length,
      customerEmail: orderToSave.customerEmail,
      shipping: {
        customerName: orderToSave.shipping.customerName,
        wilaya: orderToSave.shipping.wilaya,
        mode: orderToSave.shipping.mode,
      },
      total: orderToSave.total,
      status: orderToSave.status,
    });

    // Add order to Firestore
    console.log("[api/orders] Attempting to save order to Firestore...");
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");
    console.log("[api/orders] Orders collection reference obtained.");

    const aggregatedQuantities = orderToSave.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = (acc[item.id] ?? 0) + item.quantity;
      return acc;
    }, {});

    let createdOrderId: string | null = null;
    const productSnapshots = new Map<string, DocumentData>();

    await db.runTransaction(async (transaction) => {
      // Validate stock for each product in the cart
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

      // Decrement stock now that validation passed
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

    console.log("[api/orders] Order saved successfully to Firestore with ID:", createdOrderId);

    // Return the order ID
    return NextResponse.json(
      { orderId: createdOrderId },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/orders] FIREBASE WRITE ERROR:", error);

    // Log additional error details if available
    if (error instanceof Error) {
      console.error("[api/orders] Error name:", error.name);
      console.error("[api/orders] Error message:", error.message);
      console.error("[api/orders] Error stack:", error.stack);
    }

    // Handle Firebase-specific errors
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
        { status: isStockError ? 400 : 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Convert Firestore timestamp to ISO string
 */
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
  // Fallback to current time if invalid
  return new Date().toISOString();
}

/**
 * Convert Firestore document to Order type
 */
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
 * Fetch orders from Firestore
 * Query params:
 *   - orderId: (optional) Fetch a single order by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");

    console.log("[api/orders] GET request received", { orderId, userId });

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please check your credentials." },
        { status: 503 },
      );
    }
    const ordersCollection = db.collection("orders");

    // If orderId is provided, fetch single order
    if (orderId) {
      console.log("[api/orders] Fetching single order:", orderId);
      const orderDoc = ordersCollection.doc(orderId);
      const orderSnapshot = await orderDoc.get();

      if (!orderSnapshot.exists) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      const orderData = firestoreDocToOrder(orderSnapshot.id, orderSnapshot.data());
      console.log("[api/orders] Order fetched successfully:", orderData.id);
      return NextResponse.json(orderData);
    }

    const orders: Order[] = [];

    if (userId && userId.trim()) {
      // Fetch orders for specific user sorted by createdAt DESC
      console.log("[api/orders] Fetching orders for user...", { userId });
      const userOrdersQuery = ordersCollection
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc") as Query<DocumentData>;
      const userOrdersSnapshot = await userOrdersQuery.get();

      userOrdersSnapshot.forEach((snapshotDoc) => {
        const orderData = firestoreDocToOrder(snapshotDoc.id, snapshotDoc.data() as DocumentData);
        orders.push(orderData);
      });

      console.log("[api/orders] Fetched", orders.length, "orders for user");
      return NextResponse.json(orders);
    }

    // Otherwise, fetch all orders sorted by createdAt DESC
    console.log("[api/orders] Fetching all orders...");
    const ordersQuery = ordersCollection.orderBy("createdAt", "desc") as Query<DocumentData>;
    const ordersSnapshot = await ordersQuery.get();

    ordersSnapshot.forEach((doc) => {
      const orderData = firestoreDocToOrder(doc.id, doc.data() as DocumentData);
      orders.push(orderData);
    });

    console.log("[api/orders] Fetched", orders.length, "orders");
    return NextResponse.json(orders);
  } catch (error) {
    console.error("[api/orders] GET ERROR:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders
 * Update an order (currently only supports cancel action)
 * Body: { orderId: string, action: "cancel" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { orderId, action } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "orderId is required and must be a string" },
        { status: 400 }
      );
    }

    if (action !== "cancel") {
      return NextResponse.json(
        { error: 'Only "cancel" action is supported' },
        { status: 400 }
      );
    }

    console.log("[api/orders] PATCH request received", { orderId, action });

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured. Please check your credentials." },
        { status: 503 },
      );
    }
    const ordersCollection = db.collection("orders");
    const orderDoc = ordersCollection.doc(orderId);
    const orderSnapshot = await orderDoc.get();

    if (!orderSnapshot.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = orderSnapshot.data();
    const currentStatus = orderData.status as OrderStatus;

    // Only allow cancellation if status is "pending"
    if (currentStatus !== "pending") {
      return NextResponse.json(
        { error: `Cannot cancel order with status "${currentStatus}". Only pending orders can be cancelled.` },
        { status: 400 }
      );
    }

    // Update order to cancelled
    console.log("[api/orders] Cancelling order:", orderId);
    await orderDoc.update({
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Fetch updated order to return
    const updatedSnapshot = await orderDoc.get();
    const updatedData = updatedSnapshot.data();

    if (!updatedData) {
      throw new Error("Updated order data not found");
    }

    const updatedOrderData = firestoreDocToOrder(updatedSnapshot.id, updatedData);

    console.log("[api/orders] Order cancelled successfully:", orderId);
    return NextResponse.json(updatedOrderData);
  } catch (error) {
    console.error("[api/orders] PATCH ERROR:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
