declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

type MetaPixelParams = Record<string, unknown>;

type MetaPixelProduct = {
  id: string | number;
  name?: string;
  price: number;
  currency: string;
};

type MetaPixelItem = {
  id: string | number;
  price: number;
  quantity: number;
};

type MetaPixelCart = {
  items: MetaPixelItem[];
  value: number;
  currency: string;
};

type MetaPixelOrder = {
  orderId?: string;
  items: MetaPixelItem[];
  value: number;
  currency: string;
};

const safeFbq = (eventName: string, params?: MetaPixelParams): void => {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return;
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  if (!(window.fbq as { loaded?: boolean }).loaded) return;
  if (params) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }
};

const buildContents = (items: MetaPixelItem[]) =>
  items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    item_price: item.price,
  }));

export const pageView = (): void => {
  safeFbq("PageView");
};

export const viewContent = (product: MetaPixelProduct): void => {
  const params: MetaPixelParams = {
    content_ids: [product.id],
    content_type: "product",
    value: product.price,
    currency: product.currency,
    num_items: 1,
    contents: buildContents([{ id: product.id, price: product.price, quantity: 1 }]),
  };

  if (product.name) {
    params.content_name = product.name;
  }

  safeFbq("ViewContent", params);
};

export const addToCart = (product: MetaPixelProduct, quantity: number): void => {
  const params: MetaPixelParams = {
    content_ids: [product.id],
    content_type: "product",
    value: product.price * quantity,
    currency: product.currency,
    num_items: quantity,
    contents: buildContents([
      { id: product.id, price: product.price, quantity },
    ]),
  };

  if (product.name) {
    params.content_name = product.name;
  }

  safeFbq("AddToCart", params);
};

export const initiateCheckout = (cart: MetaPixelCart): void => {
  const numItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  safeFbq("InitiateCheckout", {
    content_ids: cart.items.map((item) => item.id),
    content_type: "product",
    value: cart.value,
    currency: cart.currency,
    num_items: numItems,
    contents: buildContents(cart.items),
  });
};

export const purchase = (order: MetaPixelOrder): void => {
  const numItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  safeFbq("Purchase", {
    content_ids: order.items.map((item) => item.id),
    content_type: "product",
    value: order.value,
    currency: order.currency,
    num_items: numItems,
    contents: buildContents(order.items),
    order_id: order.orderId,
  });
};
