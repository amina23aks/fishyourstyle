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

export type PurchaseParams = BeginCheckoutParams & {
  transaction_id: string;
  shipping?: number;
};

export function safeGtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag(...args);
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  safeGtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackAddToCart(params: AddToCartParams): void {
  safeGtag("event", "add_to_cart", {
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
  });
}

export function trackBeginCheckout(params: BeginCheckoutParams): void {
  safeGtag("event", "begin_checkout", {
    currency: params.currency,
    value: params.value,
    items: params.items,
  });
}

export function trackPurchase(params: PurchaseParams): void {
  safeGtag("event", "purchase", {
    transaction_id: params.transaction_id,
    currency: params.currency,
    value: params.value,
    shipping: params.shipping,
    items: params.items,
  });
}
