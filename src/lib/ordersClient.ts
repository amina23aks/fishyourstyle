import type { NewOrder } from "@/types/order";

type AuthUser = {
  getIdToken?: () => Promise<string>;
} | null;

export async function submitOrder(order: NewOrder, user: AuthUser) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = await user?.getIdToken?.();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch("/api/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(order),
  });
}
