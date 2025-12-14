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

export type CartItem = {
  id: string;
  slug: string;
  name: string;
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
          .map((item) => ({
            ...item,
            quantity: item.quantity ?? 1,
            variantKey: ensureVariantKey(item as CartItem),
          }));
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
      payload.maxQuantity === 0 ||
      payload.maxQuantity === null ||
      payload.maxQuantity === undefined ||
      (typeof payload.maxQuantity === 'number' && payload.maxQuantity <= 0)
    ) {
      return;
    }
    const variantKey = ensureVariantKey(payload);
    const quantityToAdd = payload.quantity ?? 1;

    setItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) => item.variantKey === variantKey,
      );

      if (existingIndex !== -1) {
        return previous.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + quantityToAdd,
                  item.maxQuantity ?? item.quantity + quantityToAdd,
                ),
              }
            : item,
        );
      }

      const initialQuantity = Math.min(
        quantityToAdd,
        payload.maxQuantity ?? quantityToAdd,
      );

      return [
        ...previous,
        {
          ...payload,
          quantity: initialQuantity,
          variantKey,
        },
      ];
    });

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
