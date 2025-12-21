"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { signInAnonymously } from "firebase/auth";
import { useAuth } from "@/context/auth";
import type { FavoriteItem } from "@/types/favorites";
import { getAuthInstance } from "@/lib/firebaseClient";

type FavoritesContextValue = {
  items: FavoriteItem[];
  isLoading: boolean;
  isUpdating: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: FavoriteItem) => Promise<void>;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function FavoritesToasts({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-end justify-center px-4 pb-6 sm:justify-end sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-sm text-white shadow-xl shadow-black/40 backdrop-blur"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!user) {
        if (isActive) {
          setItems([]);
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Failed to load favorites");
        }
        const data = await response.json();
        if (isActive) {
          setItems((data?.items ?? []) as FavoriteItem[]);
        }
      } catch (error) {
        console.error("[Favorites] Failed to fetch favorites", error);
        if (isActive) setItems([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [user]);

  const isFavorite = useCallback(
    (productId: string) => items.some((item) => (item.productId ?? item.id) === productId),
    [items],
  );

  const toggleFavorite = useCallback(
    async (product: FavoriteItem) => {
      if (isUpdating) return;
      let currentUser = user;
      if (!currentUser) {
        try {
          const auth = getAuthInstance();
          if (!auth) throw new Error("Auth unavailable");
          const credential = await signInAnonymously(auth);
          currentUser = credential.user;
        } catch (error) {
          console.error("[Favorites] Anonymous sign-in failed", error);
          pushToast("Please sign in to save favorites.", "info");
          return;
        }
      }

      const normalized: FavoriteItem = {
        ...product,
        id: product.id,
        productId: product.productId ?? product.id,
        addedAt: typeof product.addedAt === "string" ? product.addedAt : new Date().toISOString(),
      };

      const previousItems = items;
      const targetId = normalized.productId ?? normalized.id;
      const wasFavorite = items.some((item) => (item.productId ?? item.id) === targetId);
      const optimisticItems = wasFavorite
        ? items.filter((item) => (item.productId ?? item.id) !== targetId)
        : [normalized, ...items];
      setItems(optimisticItems);
      setIsUpdating(true);

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: normalized.productId ?? normalized.id,
            slug: normalized.slug,
            name: normalized.name,
            image: normalized.image,
            price: normalized.price,
            currency: normalized.currency,
            inStock: normalized.inStock,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update favorites");
        }

        const data = await response.json();
        setItems((data?.items ?? []) as FavoriteItem[]);
        pushToast(wasFavorite ? "Removed from favorites." : "Added to favorites.", "success");
      } catch (error) {
        console.error("[Favorites] Toggle failed", error);
        setItems(previousItems);
        pushToast("Unable to update favorites. Please try again.", "error");
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, items, pushToast, user],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      items,
      isLoading: isLoading || authLoading,
      isUpdating,
      isFavorite,
      toggleFavorite,
    }),
    [authLoading, isFavorite, isLoading, isUpdating, items, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <FavoritesToasts toasts={toasts} />
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return ctx;
}
