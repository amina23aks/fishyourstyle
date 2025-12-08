import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

import { getDb } from "./firebaseClient";
import type { Order, OrderStatus } from "@/types/order";

function timestampToISO(timestamp: unknown): string {
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (typeof timestamp === "string") return timestamp;
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeOrder(data: DocumentData, id: string): Order {
  const shipping = data.shipping as Order["shipping"] | undefined;

  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
    items: Array.isArray(data.items) ? data.items : [],
    shipping:
      shipping ?? {
        customerName: "Unknown",
        phone: "",
        wilaya: "",
        address: "",
        mode: "home",
        price: 0,
      },
    notes: typeof data.notes === "string" ? data.notes : undefined,
    subtotal: typeof data.subtotal === "number" ? data.subtotal : 0,
    shippingCost: typeof data.shippingCost === "number" ? data.shippingCost : 0,
    total: typeof data.total === "number" ? data.total : 0,
    paymentMethod: data.paymentMethod === "COD" ? "COD" : "COD",
    status:
      typeof data.status === "string" &&
      ["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(data.status)
        ? (data.status as OrderStatus)
        : "pending",
    createdAt: timestampToISO(data.createdAt),
    updatedAt: timestampToISO(data.updatedAt),
    cancelledAt: data.cancelledAt ? timestampToISO(data.cancelledAt) : undefined,
  };
}

export async function fetchRecentOrders(limitCount = 25): Promise<Order[]> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase is not configured. Please check environment variables.");
  }

  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(ordersQuery);
  return snapshot.docs.map((doc) => normalizeOrder(doc.data(), doc.id));
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase is not configured. Please check environment variables.");
  }

  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
}
