export const FB_PIXEL_ID = "1217191333852885";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

type MetaPixelParams = Record<string, unknown>;

type ViewContentParams = {
  content_ids: Array<string | number>;
  content_name: string;
  content_type: string;
  value: number;
  currency: string;
};

type AddToCartParams = {
  content_ids: Array<string | number>;
  content_name: string;
  value: number;
  currency: string;
};

type InitiateCheckoutParams = {
  value: number;
  currency: string;
  num_items: number;
};

type PurchaseParams = {
  value: number;
  currency: string;
  content_ids: Array<string | number>;
  num_items: number;
  order_id?: string;
};

const safeFbq = (eventName: string, params?: MetaPixelParams): void => {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  if (params) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }
};

export const pageview = (): void => {
  safeFbq("PageView");
};

export const event = (name: string, params?: MetaPixelParams): void => {
  safeFbq(name, params);
};

export const viewContent = (params: ViewContentParams): void => {
  safeFbq("ViewContent", params);
};

export const addToCart = (params: AddToCartParams): void => {
  safeFbq("AddToCart", params);
};

export const initiateCheckout = (params: InitiateCheckoutParams): void => {
  safeFbq("InitiateCheckout", params);
};

export const purchase = (params: PurchaseParams): void => {
  safeFbq("Purchase", params);
};
