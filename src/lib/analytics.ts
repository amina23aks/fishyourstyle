import { hasAnalyticsConsent } from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type GtagItem = {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
};

export type AddToCartParams = GtagItem & {
  currency: string;
};

export type BeginCheckoutParams = {
  value: number;
  currency: string;
  items: GtagItem[];
};

export type ViewItemParams = BeginCheckoutParams;

export type PurchaseParams = BeginCheckoutParams & {
  transaction_id: string;
  shipping?: number;
};

const PURCHASE_STORAGE_KEY = "ga4_purchase_sent_v1";

export const isDebugMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debug_mode") === "true";
};

const withDebugMode = <T extends Record<string, unknown>>(payload: T): T => {
  if (!isDebugMode()) return payload;
  return { ...payload, debug_mode: true };
};

const mapItems = (items: GtagItem[]): GtagItem[] =>
  items.map((item) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    price: Number(item.price),
    quantity: Number(item.quantity),
  }));

export function safeGtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  const command = args[0];
  if (command !== "consent" && !hasAnalyticsConsent()) return;
  window.gtag(...args);
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  safeGtag("event", "page_view", withDebugMode({
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  }));
}

export function trackAddToCart(params: AddToCartParams): void {
  const price = Number(params.price);
  const quantity = Number(params.quantity);
  safeGtag("event", "add_to_cart", withDebugMode({
    currency: params.currency,
    value: price * quantity,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price,
        quantity,
      },
    ],
  }));
}

export function trackBeginCheckout(params: BeginCheckoutParams): void {
  safeGtag("event", "begin_checkout", withDebugMode({
    currency: params.currency,
    value: Number(params.value),
    items: mapItems(params.items),
  }));
}

export function trackViewItem(params: ViewItemParams): void {
  safeGtag("event", "view_item", withDebugMode({
    currency: params.currency,
    value: params.value,
    items: params.items,
  }));
}

export function trackViewCart(params: ViewItemParams): void {
  safeGtag("event", "view_cart", withDebugMode({
    currency: params.currency,
    value: params.value,
    items: params.items,
  }));
}

const readPurchaseIds = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  const stored = window.localStorage.getItem(PURCHASE_STORAGE_KEY);
  if (!stored) return new Set();
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((value): value is string => typeof value === "string" && value.length > 0));
    }
  } catch {
    return new Set();
  }
  return new Set();
};

const writePurchaseIds = (ids: Set<string>): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage write errors.
  }
};

export function trackPurchase(params: PurchaseParams): void {
  const transactionId = params.transaction_id;
  const purchaseIds = readPurchaseIds();
  if (transactionId && purchaseIds.has(transactionId)) return;

  const shipping = typeof params.shipping === "number" ? params.shipping : undefined;

  safeGtag("event", "purchase", withDebugMode({
    transaction_id: params.transaction_id,
    currency: params.currency,
    value: Number(params.value),
    shipping,
    items: mapItems(params.items),
  }));

  if (transactionId) {
    purchaseIds.add(transactionId);
    writePurchaseIds(purchaseIds);
  }
}
