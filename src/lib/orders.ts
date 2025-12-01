export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  itemsSummary: string;
  notes?: string;
  total: number;
  createdAt: string;
};

const STORAGE_KEY = "fishyourstyle-orders";

const isBrowser = typeof window !== "undefined";

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

function persistOrders(orders: Order[]) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Failed to write orders to storage", error);
  }
}

export function getOrders(): Order[] {
  return readStorage();
}

export type NewOrder = Omit<Order, "id" | "createdAt">;

export function addOrder(order: NewOrder): Order | undefined {
  if (!isBrowser) return undefined;

  const orders = readStorage();
  const newOrder: Order = {
    ...order,
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  persistOrders([...orders, newOrder]);
  return newOrder;
}
