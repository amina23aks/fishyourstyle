"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  colorName: string;
  colorCode: string;
  size: string;
  price: number;
  currency: string;
  quantity: number;
};

export type CartTotals = {
  subtotal: number;
};

export type CartContextValue = {
  items: CartItem[];
  totals: CartTotals;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "fys-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      } catch (error) {
        console.error("Failed to parse cart from storage", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totals = useMemo(
    () => ({
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    }),
    [items],
  );

  const clearCart = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      totals,
      clearCart,
    }),
    [items, totals],
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
