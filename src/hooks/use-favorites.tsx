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
import { AnimatePresence, motion } from "@/lib/motion";
import type { FavoriteItem } from "@/types/favorites";

type FavoriteToast = { id: number; message: string; type: "success" | "error" | "info" };

type FavoritePayload = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  colorName?: string | null;
  colorCode?: string | null;
  size?: string | null;
  variantKey: string;
};

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  isFavorite: (productId: string, variantKey?: string | null) => boolean;
  toggleFavorite: (payload: FavoritePayload) => Promise<void>;
  loadingIds: Set<string>;
  isLoading: boolean;
  error: string | null;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function normalizeVariantKey(productId: string, variantKey?: string) {
  const key = (variantKey ?? productId).trim().toLowerCase();
  return key || productId.toLowerCase();
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<FavoriteToast[]>([]);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((toast: Omit<FavoriteToast, "id">) => {
    const id = ++toastIdRef.current;
    setToasts((previous) => [...previous, { ...toast, id }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Failed to load favorites.");
      }
      const data = (await response.json()) as { items?: FavoriteItem[] };
      setFavorites(data.items ?? []);
    } catch (err) {
      console.error("[useFavorites] Failed to fetch favorites", err);
      setError(err instanceof Error ? err.message : "Failed to load favorites.");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((productId: string, variantKey?: string | null) => {
    const key = normalizeVariantKey(productId, variantKey ?? undefined);
    return favorites.some((item) => normalizeVariantKey(item.productId, item.variantKey) === key);
  }, [favorites]);

  const toggleFavorite = useCallback(
    async (payload: FavoritePayload) => {
      if (!user) {
        pushToast({ message: "Please log in to use favorites.", type: "info" });
        return;
      }

      const variantKey = normalizeVariantKey(payload.productId, payload.variantKey);
      const optimisticExists = isFavorite(payload.productId, variantKey);
      const optimisticFavorites = optimisticExists
        ? favorites.filter((item) => normalizeVariantKey(item.productId, item.variantKey) !== variantKey)
        : [...favorites, { ...payload, variantKey, addedAt: new Date().toISOString() }];

      setFavorites(optimisticFavorites);
      setLoadingIds((prev) => new Set(prev).add(variantKey));

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...payload,
            variantKey,
            userId: user.uid,
            email: user.email ?? undefined,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || "Unable to update favorites.");
        }

        const data = (await response.json()) as { favorites?: FavoriteItem[]; status?: "added" | "removed" };
        setFavorites(data.favorites ?? []);
        if (data.status === "added") {
          pushToast({ message: "Added to favorites.", type: "success" });
        } else if (data.status === "removed") {
          pushToast({ message: "Removed from favorites.", type: "info" });
        }
      } catch (err) {
        console.error("[useFavorites] toggle error", err);
        setFavorites(favorites);
        pushToast({ message: err instanceof Error ? err.message : "Unable to update favorites.", type: "error" });
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(variantKey);
          return next;
        });
      }
    },
    [favorites, isFavorite, pushToast, user],
  );

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      loadingIds,
      isLoading,
      error,
    }),
    [favorites, isFavorite, toggleFavorite, loadingIds, isLoading, error],
  );

  return (
    <FavoritesContext.Provider value={value}>
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
