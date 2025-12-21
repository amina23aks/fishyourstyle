"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Timestamp } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/auth";
import type { FavoriteItem } from "@/types/favorites";

type FavoritesContextValue = {
  items: FavoriteItem[];
  isLoading: boolean;
  isUpdating: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function normalizeItem(raw: FavoriteItem | (FavoriteItem & { addedAt?: { seconds: number; nanoseconds: number } | number | null })): FavoriteItem {
  const addedAt = (() => {
    const value = (raw as { addedAt?: unknown }).addedAt;
    if (!value) return Timestamp.fromMillis(Date.now());
    if (value instanceof Timestamp) return value;
    if (typeof value === "number") return Timestamp.fromMillis(value);
    if (typeof value === "object" && typeof (value as { seconds?: unknown }).seconds === "number") {
      const { seconds, nanoseconds } = value as { seconds: number; nanoseconds?: number };
      return new Timestamp(seconds, nanoseconds ?? 0);
    }
    return Timestamp.fromMillis(Date.now());
  })();

  return {
    ...raw,
    addedAt,
  };
}

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
  const lastKnownItems = useRef<FavoriteItem[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const pushToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2400);
  }, []);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!user) {
        lastKnownItems.current = [];
        setItems([]);
        setIsLoading(false);
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
        const serverItems = (data?.items ?? []).map(normalizeItem);
        if (!isActive) return;
        lastKnownItems.current = serverItems;
        setItems(serverItems);
      } catch (error) {
        console.error("[FavoritesProvider] Failed to fetch favorites", error);
        if (!isActive) return;
        lastKnownItems.current = [];
        setItems([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      lastKnownItems.current = [];
    }
  }, [user, pathname]);

  const isFavorite = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items],
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        pushToast("Please sign in to use favorites.", "info");
        router.push("/account");
        return;
      }

      setIsUpdating(true);
      const wasFavorite = isFavorite(productId);
      const optimisticItems = wasFavorite
        ? items.filter((item) => item.productId !== productId)
        : [
            ...items,
            normalizeItem({
              productId,
              slug: "",
              name: "Saving...",
              image: "",
              price: 0,
              currency: "DZD",
              inStock: true,
              addedAt: Timestamp.fromMillis(Date.now()),
            }),
          ];

      setItems(optimisticItems);

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          throw new Error("Failed to update favorites");
        }

        const data = await response.json();
        const serverItems = (data?.items ?? []).map(normalizeItem);
        setItems(serverItems);
        lastKnownItems.current = serverItems;
        pushToast(wasFavorite ? "Removed from favorites." : "Added to favorites.", "success");
      } catch (error) {
        console.error("[FavoritesProvider] Toggle failed", error);
        setItems(lastKnownItems.current);
        pushToast("Unable to update favorites. Please try again.", "error");
      } finally {
        setIsUpdating(false);
      }
    },
    [isFavorite, items, pushToast, router, user],
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
