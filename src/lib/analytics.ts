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

const withDebugMode = <T extends Record<string, unknown>>(payload: T): T => {
  if (process.env.NODE_ENV === "production") return payload;
  return { ...payload, debug_mode: true };
};

export function safeGtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
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
  safeGtag("event", "add_to_cart", withDebugMode({
    currency: params.currency,
    value: params.price * params.quantity,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        quantity: params.quantity,
      },
    ],
  }));
}

export function trackBeginCheckout(params: BeginCheckoutParams): void {
  safeGtag("event", "begin_checkout", withDebugMode({
    currency: params.currency,
    value: params.value,
    items: params.items,
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
}

export function trackPurchase(params: PurchaseParams): void {
  const transactionId = params.transaction_id;
  const purchaseIds = readPurchaseIds();
  if (transactionId && purchaseIds.has(transactionId)) return;

  safeGtag("event", "purchase", withDebugMode({
    transaction_id: params.transaction_id,
    currency: params.currency,
    value: params.value,
    shipping: params.shipping,
    items: params.items,
  }));

  if (transactionId) {
    purchaseIds.add(transactionId);
    writePurchaseIds(purchaseIds);
  }
}
