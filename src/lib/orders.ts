import type { Order, NewOrder } from "@/types/order";

const STORAGE_KEY = "fishyourstyle-orders";

const isBrowser = typeof window !== "undefined";

/**
 * Read orders from localStorage (legacy - will be replaced by API calls).
 * @deprecated Use API route GET /api/orders instead
 */
function readStorage(): Order[] {
  if (!isBrowser) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read orders from storage", error);
    return [];
  }
}

/**
 * Persist orders to localStorage (legacy - will be replaced by API calls).
 * @deprecated Use API route POST /api/orders instead
 */
function persistOrders(orders: Order[]) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Failed to write orders to storage", error);
  }
}

/**
 * Get all orders from localStorage.
 * @deprecated Use API route GET /api/orders instead
 */
export function getOrders(): Order[] {
  return readStorage();
}

/**
 * Add a new order to localStorage.
 * @deprecated Use API route POST /api/orders instead
 * @param order - New order data (without id, createdAt, updatedAt)
 * @returns Created order with generated fields, or undefined if not in browser
 */
export function addOrder(order: NewOrder): Order | undefined {
  if (!isBrowser) return undefined;

  const orders = readStorage();
  const now = new Date().toISOString();
  const newOrder: Order = {
    ...order,
    id: crypto.randomUUID ? crypto.randomUUID() : `order-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  persistOrders([...orders, newOrder]);
  return newOrder;
}
