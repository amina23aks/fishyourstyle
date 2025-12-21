"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/context/auth";
import type { WishlistItem } from "@/types/wishlist";
import { AnimatePresence, motion } from "@/lib/motion";

type WishlistToast = { id: number; message: string; type: "success" | "error" | "info" };

type WishlistAddPayload = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  colorName?: string;
  colorCode?: string;
  size?: string;
  variantKey?: string;
};

type WishlistIdentifier = {
  productId: string;
  variantKey?: string;
  colorName?: string;
  size?: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId: string, variantKey?: string, colorName?: string, size?: string) => boolean;
  addToWishlist: (item: WishlistAddPayload) => Promise<void>;
  removeFromWishlist: (ident: WishlistIdentifier) => Promise<void>;
  toggleWishlist: (item: WishlistAddPayload) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const normalizeVariantKey = (
  productId: string,
  variantKey?: string,
  colorName?: string,
  size?: string,
) => {
  const trimmed = (variantKey ?? "").trim();
  if (trimmed) return trimmed.toLowerCase();
  const color = (colorName ?? "").trim().toLowerCase();
  const normalizedSize = (size ?? "").trim().toLowerCase();
  if (color || normalizedSize) {
    return `${productId}-${color}-${normalizedSize}`.toLowerCase();
  }
  return productId.toLowerCase();
};

const matchesWishlistItem = (item: WishlistItem, ident: WishlistIdentifier): boolean => {
  const currentKey = normalizeVariantKey(item.productId, item.variantKey, item.colorName, item.size);
  const targetKey = normalizeVariantKey(ident.productId, ident.variantKey, ident.colorName, ident.size);
  return currentKey === targetKey;
};

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<WishlistToast[]>([]);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((toast: Omit<WishlistToast, "id">) => {
    const id = ++toastIdRef.current;
    setToasts((previous) => [...previous, { ...toast, id }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadWishlist = async () => {
      if (authLoading) return;
      if (!user) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || "Failed to load wishlist.");
        }
        const data = (await response.json()) as { items?: WishlistItem[] };
        if (isMounted) {
          setItems(data.items ?? []);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("[useWishlist] Failed to fetch wishlist", err);
        setError(err instanceof Error ? err.message : "Failed to load wishlist.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadWishlist();
    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  const isInWishlist = useCallback(
    (productId: string, variantKey?: string, colorName?: string, size?: string) => {
      return items.some((item) => matchesWishlistItem(item, { productId, variantKey, colorName, size }));
    },
    [items],
  );

  const addToWishlist = useCallback(
    async (payload: WishlistAddPayload) => {
      if (!user) {
        pushToast({ message: "Please log in to save items to your wishlist.", type: "info" });
        return;
      }

      const variantKey = normalizeVariantKey(payload.productId, payload.variantKey, payload.colorName, payload.size);
      const optimisticItem: WishlistItem = {
        ...payload,
        variantKey,
        addedAt: new Date().toISOString(),
      };

      setItems((previous) => {
        if (previous.some((item) => matchesWishlistItem(item, { productId: payload.productId, variantKey }))) {
          return previous;
        }
        return [...previous, optimisticItem];
      });

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || "Failed to update wishlist.");
        }

        const data = (await response.json()) as { items?: WishlistItem[] };
        setItems(data.items ?? []);
        pushToast({ message: "Added to wishlist.", type: "success" });
      } catch (err) {
        console.error("[useWishlist] Failed to add wishlist item", err);
        setError(err instanceof Error ? err.message : "Failed to update wishlist.");
        setItems((previous) =>
          previous.filter((item) => !matchesWishlistItem(item, { productId: payload.productId, variantKey })),
        );
        const message = err instanceof Error ? err.message : "Unable to save to wishlist.";
        pushToast({ message, type: "error" });
      }
    },
    [pushToast, user],
  );

  const removeFromWishlist = useCallback(
    async (ident: WishlistIdentifier) => {
      if (!user) {
        pushToast({ message: "Please log in to manage your wishlist.", type: "info" });
        return;
      }

      const variantKey = normalizeVariantKey(ident.productId, ident.variantKey, ident.colorName, ident.size);
      const previousItems = items;

      setItems((current) => current.filter((item) => !matchesWishlistItem(item, { ...ident, variantKey })));

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/wishlist", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...ident, variantKey }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || "Failed to remove wishlist item.");
        }

        const data = (await response.json()) as { items?: WishlistItem[] };
        setItems(data.items ?? []);
        pushToast({ message: "Removed from wishlist.", type: "info" });
      } catch (err) {
        console.error("[useWishlist] Failed to remove wishlist item", err);
        setError(err instanceof Error ? err.message : "Failed to remove wishlist item.");
        setItems(previousItems);
        pushToast({ message: "Unable to update wishlist.", type: "error" });
      }
    },
    [items, pushToast, user],
  );

  const toggleWishlist = useCallback(
    async (payload: WishlistAddPayload) => {
      const variantKey = normalizeVariantKey(payload.productId, payload.variantKey, payload.colorName, payload.size);
      if (isInWishlist(payload.productId, variantKey, payload.colorName, payload.size)) {
        await removeFromWishlist({
          productId: payload.productId,
          variantKey,
          colorName: payload.colorName,
          size: payload.size,
        });
      } else {
        await addToWishlist({ ...payload, variantKey });
      }
    },
    [addToWishlist, isInWishlist, removeFromWishlist],
  );

  const value = useMemo(
    () => ({
      items,
      isLoading,
      error,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
    }),
    [addToWishlist, error, isInWishlist, isLoading, items, removeFromWishlist, toggleWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl shadow-black/30 backdrop-blur ${
                toast.type === "success"
                  ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-300/40"
                  : toast.type === "error"
                    ? "bg-rose-500/15 text-rose-50 ring-1 ring-rose-300/40"
                    : "bg-white/15 text-white ring-1 ring-white/30"
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
