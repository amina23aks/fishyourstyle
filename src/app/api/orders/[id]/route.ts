import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { getServerDb } from "@/lib/firestore";
import type { Order, OrderStatus } from "@/types/order";

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

function firestoreDataToOrder(orderId: string, data: Record<string, unknown>): Order {
  const status = (data.status ?? "pending") as OrderStatus;

  return {
    id: orderId,
    customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : "",
    items: Array.isArray(data.items) ? (data.items as Order["items"]) : [],
    shipping: data.shipping as Order["shipping"],
    notes: typeof data.notes === "string" ? data.notes : undefined,
    subtotal: Number(data.subtotal ?? 0),
    shippingCost: Number(data.shippingCost ?? 0),
    total: Number(data.total ?? 0),
    paymentMethod: (data.paymentMethod as Order["paymentMethod"]) ?? "COD",
    status,
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
    cancelledAt: data.cancelledAt ? timestampToISO(data.cancelledAt) : undefined,
  };
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  try {
    const db = getServerDb();
    const orderRef = doc(db, "orders", orderId);
    const snapshot = await getDoc(orderRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = snapshot.data();
    const order = firestoreDataToOrder(snapshot.id, data);

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }

    await updateDoc(orderRef, {
      status: "cancelled",
      updatedAt: serverTimestamp(),
      cancelledAt: serverTimestamp(),
    });

    const updatedSnapshot = await getDoc(orderRef);
    const updatedData = updatedSnapshot.data();

    if (!updatedData) {
      return NextResponse.json(
        { error: "Failed to read updated order" },
        { status: 500 }
      );
    }

    const updatedOrder = firestoreDataToOrder(updatedSnapshot.id, updatedData);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("[api/orders/:id] PATCH ERROR:", error);

    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
