import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

import { getAuthInstance, getDb } from "./firebaseClient";
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
  const auth = getAuthInstance();
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Admin authentication is required to update order status.");
  }

  const response = await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: nextStatus }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || "Failed to update order status";
    throw new Error(message);
  }
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase is not configured. Please check environment variables.");
  }

  const orderRef = doc(db, "orders", orderId);
  const snapshot = await getDoc(orderRef);

  if (!snapshot.exists()) return null;

  return normalizeOrder(snapshot.data(), snapshot.id);
}
