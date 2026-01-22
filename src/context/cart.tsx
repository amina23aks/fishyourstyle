"use client";

import {
  useCallback,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trackAddToCart } from "@/lib/analytics";
import { addToCart as trackMetaAddToCart } from "@/lib/metaPixel";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  category?: string;
  design?: string;
  stockMode?: "unlimited" | "limited";
  stockQty?: number;
  price: number;
  currency: string;
  image: string;
  colorName: string;
  colorCode: string;
  size: string;
  quantity: number;
  variantKey: string;
  maxQuantity?: number;
};

export type AddItemPayload = {
  id: string;
  slug: string;
  name: string;
  category?: string;
  design?: string;
  stockMode?: "unlimited" | "limited";
  stockQty?: number;
  price: number;
  currency: string;
  image: string;
  colorName: string;
  colorCode: string;
  size: string;
  quantity?: number;
  maxQuantity?: number;
};

export type CartTotals = {
  subtotal: number;
};

export type CartContextValue = {
  items: CartItem[];
  totals: CartTotals;
  totalQuantity: number;
  lastAddedAt: number | null;
  addItem: (payload: AddItemPayload) => void;
  removeItem: (id: string, variantKey: string) => void;
  updateQty: (id: string, variantKey: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "fys-cart";

const makeVariantKey = (item: { id: string; colorCode: string; size: string }) =>
  `${item.id}-${item.colorCode}-${item.size}`.toLowerCase();

const ensureVariantKey = (item: CartItem | AddItemPayload): string =>
  "variantKey" in item && item.variantKey
    ? item.variantKey
    : makeVariantKey(item);

export const normalizeCartItem = (item: CartItem | AddItemPayload): CartItem => ({
  ...item,
  category: typeof item.category === "string" ? item.category : "",
  design: typeof item.design === "string" ? item.design : "",
  stockMode:
    item.stockMode === "limited" || item.stockMode === "unlimited"
      ? item.stockMode
      : typeof item.maxQuantity === "number"
        ? "limited"
        : "unlimited",
  stockQty:
    typeof item.stockQty === "number"
      ? Math.max(item.stockQty, 0)
      : typeof item.maxQuantity === "number"
        ? Math.max(item.maxQuantity, 0)
        : 0,
  quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
  maxQuantity: typeof item.maxQuantity === "number" ? Math.max(item.maxQuantity, 0) : undefined,
  variantKey: ensureVariantKey(item),
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedAt, setLastAddedAt] = useState<number | null>(null);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<CartItem>[];
        const normalized = parsed
          .filter((item): item is CartItem => Boolean(item))
          .map((item) => normalizeCartItem(item as CartItem));
        setItems(normalized);
      } catch (error) {
        console.error("Failed to parse cart from storage", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((payload: AddItemPayload) => {
    // HARD BLOCK: block all add-to-cart if out of stock per single source of truth
    if (
      typeof payload.maxQuantity === "number" && payload.maxQuantity <= 0
    ) {
      return;
    }
    const variantKey = ensureVariantKey(payload);
    const quantityToAdd = payload.quantity ?? 1;
    let addedQuantity = 0;

    setItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) => item.variantKey === variantKey,
      );

      if (existingIndex !== -1) {
        return previous.map((item, index) => {
          if (index !== existingIndex) {
            return item;
          }
          const nextQuantity = Math.min(
            item.quantity + quantityToAdd,
            item.maxQuantity ?? item.quantity + quantityToAdd,
          );
          addedQuantity = Math.max(nextQuantity - item.quantity, 0);
          return {
            ...item,
            quantity: nextQuantity,
          };
        });
      }

      const initialQuantity = Math.min(
        quantityToAdd,
        payload.maxQuantity ?? quantityToAdd,
      );
      addedQuantity = initialQuantity;

      return [
        ...previous,
        {
          ...payload,
          quantity: initialQuantity,
          variantKey,
        },
      ];
    });

    if (addedQuantity > 0) {
      trackAddToCart({
        item_id: payload.id,
        item_name: payload.name,
        price: payload.price,
        currency: "DZD",
        quantity: addedQuantity,
      });
      // Meta Pixel: AddToCart event.
      trackMetaAddToCart(
        {
          id: payload.id,
          name: payload.name,
          price: payload.price,
          currency: payload.currency ?? "DZD",
        },
        addedQuantity,
      );
    }
    setLastAddedAt(Date.now());
  }, []);

  const removeItem = useCallback((id: string, variantKey: string) => {
    setItems((previous) =>
      previous.filter(
        (item) => !(item.id === id && item.variantKey === variantKey),
      ),
    );
  }, []);

  const updateQty = useCallback(
    (id: string, variantKey: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id, variantKey);
        return;
      }

      setItems((previous) =>
        previous.map((item) => {
          if (item.id === id && item.variantKey === variantKey) {
            const max = item.maxQuantity;
            const nextQuantity =
              typeof max === "number" && max > 0 ? Math.min(quantity, max) : quantity;
            return { ...item, quantity: nextQuantity };
          }
          return item;
        }),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(
    () => ({
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    }),
    [items],
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      totals,
      totalQuantity,
      lastAddedAt,
      addItem,
      removeItem,
      updateQty,
      clearCart,
    }),
    [addItem, clearCart, items, lastAddedAt, removeItem, totalQuantity, totals, updateQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
