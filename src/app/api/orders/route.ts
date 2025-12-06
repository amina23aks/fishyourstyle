import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getServerDb } from "@/lib/firestore";
import type { NewOrder, ShippingInfo } from "@/types/order";

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

    // Get Firestore instance
    console.log("[api/orders] Getting Firestore instance...");
    const db = getServerDb();
    console.log("[api/orders] Firestore instance obtained.");

    // Prepare order data for Firestore
    const orderDataForFirestore = {
      ...orderToSave,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
    const ordersCollection = collection(db, "orders");
    console.log("[api/orders] Orders collection reference obtained.");
    
    const docRef = await addDoc(ordersCollection, orderDataForFirestore);
    console.log("[api/orders] Order saved successfully to Firestore with ID:", docRef.id);

    // Return the order ID
    return NextResponse.json(
      { orderId: docRef.id },
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
      return NextResponse.json(
        { error: `Failed to create order: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
