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
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/auth";
import type { FavoriteItem } from "@/types/favorites";

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
const GUEST_STORAGE_KEY = "fys-favorites-guest";

type GuestFavoriteItem = Omit<FavoriteItem, "addedAt"> & { addedAt: string };

function readGuestFavorites(): GuestFavoriteItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GuestFavoriteItem[];
  } catch {
    return [];
  }
}

function writeGuestFavorites(items: GuestFavoriteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
}

function sortGuestFavorites(items: GuestFavoriteItem[]) {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.addedAt);
    const bTime = Date.parse(b.addedAt);
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function normalizeAddedAt(value: FavoriteItem["addedAt"]) {
  if (value instanceof Timestamp) return value;
  if (typeof value === "string") return Timestamp.fromDate(new Date(value));
  if (value && typeof (value as { seconds?: number }).seconds === "number") {
    const seconds = (value as { seconds: number; nanoseconds?: number }).seconds;
    const nanoseconds = (value as { nanoseconds?: number }).nanoseconds ?? 0;
    return new Timestamp(seconds, nanoseconds);
  }
  return Timestamp.now();
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
      const guestFavorites = readGuestFavorites();
      if (!user) {
        if (isActive) {
          setItems(
            guestFavorites.map((item) => ({
              ...item,
              addedAt: normalizeAddedAt(item.addedAt),
            })),
          );
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
        const serverItems = (data?.items ?? []) as FavoriteItem[];
        const serverIds = new Set(serverItems.map((item) => item.productId ?? item.id));
        const toMerge = guestFavorites.filter((item) => !serverIds.has(item.productId ?? item.id));

        for (const item of toMerge) {
          await fetch("/api/favorites", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: item.productId ?? item.id,
              slug: item.slug,
              name: item.name,
              image: item.image,
              price: item.price,
              currency: item.currency,
              inStock: item.inStock,
            }),
          });
        }

        if (toMerge.length > 0) {
          const updated = await fetch("/api/favorites", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const updatedData = await updated.json();
          if (isActive) {
            setItems((updatedData?.items ?? []) as FavoriteItem[]);
          }
        } else if (isActive) {
          setItems(serverItems);
        }

        writeGuestFavorites([]);
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
      if (!user) {
        const guestFavorites = readGuestFavorites();
        const productId = product.productId ?? product.id;
        const exists = guestFavorites.some((item) => (item.productId ?? item.id) === productId);
        const nowIso = new Date().toISOString();
        const nextFavorites = sortGuestFavorites(
          exists
            ? guestFavorites.filter((item) => (item.productId ?? item.id) !== productId)
            : [
                ...guestFavorites,
                {
                  ...product,
                  productId,
                  addedAt: nowIso,
                },
              ],
        );
        writeGuestFavorites(nextFavorites);
        setItems(
          nextFavorites.map((item) => ({
            ...item,
            addedAt: normalizeAddedAt(item.addedAt),
          })),
        );
        pushToast("Saved to favorites. Create an account to keep your favorites across devices.", "info");
        return;
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
        const token = await user.getIdToken();
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
