import type { NewOrder } from "@/types/order";

type AuthUser = {
  getIdToken?: () => Promise<string>;
} | null;

type AbuseProtectionPayload = {
  company?: string;
  website?: string;
};

export async function submitOrder(order: NewOrder, user: AuthUser, abuseProtection?: AbuseProtectionPayload) {
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
    body: JSON.stringify({ ...order, ...abuseProtection }),
  });
}
