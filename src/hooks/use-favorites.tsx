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
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/auth";
import type { FavoriteItem } from "@/types/favorites";

type FavoritesContextValue = {
  items: FavoriteItem[];
  isLoading: boolean;
  isUpdating: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (input: { productId: string; productData?: Omit<FavoriteItem, "productId" | "addedAt"> }) => Promise<void>;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const STORAGE_KEY = "favoritesGuest";

function readGuestFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<FavoriteItem> & { addedAt?: number | { seconds: number; nanoseconds?: number } }>;
    return parsed
      .filter((item): item is FavoriteItem => Boolean(item?.productId))
      .map((item) =>
        normalizeItem({
          ...item,
          addedAt: item.addedAt,
        } as FavoriteItem),
      );
  } catch (error) {
    console.error("[Favorites] Failed to parse guest favorites", error);
    return [];
  }
}

function writeGuestFavorites(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  try {
    const serialized = items.map((item) => ({
      ...item,
      addedAt: item.addedAt?.toMillis?.() ?? Date.now(),
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error("[Favorites] Failed to persist guest favorites", error);
  }
}

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
      const guestFavorites = readGuestFavorites();
      if (!user) {
        lastKnownItems.current = guestFavorites;
        setItems(guestFavorites);
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
        const merged = mergeFavorites(serverItems, guestFavorites);

        // Push missing guest items to Firestore
        const missing = guestFavorites.filter(
          (guestItem) =>
            !serverItems.some((serverItem: FavoriteItem) => serverItem.productId === guestItem.productId),
        );
        for (const entry of missing) {
          await fetch("/api/favorites", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId: entry.productId }),
          }).catch((error) => {
            console.error("[FavoritesProvider] Failed to merge guest favorite", entry.productId, error);
          });
        }

        const finalResponse = await fetch("/api/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const latestData = await finalResponse.json().catch(() => ({ items: merged }));
        const finalItems = (latestData?.items ?? merged).map(normalizeItem);

        if (!isActive) return;
        writeGuestFavorites([]);
        lastKnownItems.current = finalItems;
        setItems(finalItems);
      } catch (error) {
        console.error("[FavoritesProvider] Failed to fetch favorites", error);
        if (!isActive) return;
        lastKnownItems.current = guestFavorites;
        setItems(guestFavorites);
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
      const guestFavorites = readGuestFavorites();
      setItems(guestFavorites);
      lastKnownItems.current = guestFavorites;
    }
  }, [user, pathname]);

  const isFavorite = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items],
  );

  const toggleFavorite = useCallback(
    async ({
      productId,
      productData,
    }: {
      productId: string;
      productData?: Omit<FavoriteItem, "productId" | "addedAt">;
    }) => {
      const existing = items.find((item) => item.productId === productId);
      const baseData =
        existing ??
        (productData
          ? normalizeItem({
              ...productData,
              productId,
              addedAt: Timestamp.fromMillis(Date.now()),
            } as FavoriteItem)
          : null);

      if (!user) {
        if (!baseData) {
          pushToast("Unable to update favorites. Please try again.", "error");
          return;
        }
        const wasFavorite = Boolean(existing);
        const nextItems = wasFavorite
          ? items.filter((item) => item.productId !== productId)
          : [...items, baseData];
        setItems(nextItems);
        lastKnownItems.current = nextItems;
        writeGuestFavorites(nextItems);
        pushToast(wasFavorite ? "Removed from favorites." : "Added to favorites.", "success");
        return;
      }

      if (!baseData) {
        pushToast("Unable to update favorites. Please try again.", "error");
        return;
      }

      setIsUpdating(true);
      const wasFavorite = Boolean(existing);
      const optimisticItems = wasFavorite
        ? items.filter((item) => item.productId !== productId)
        : [...items, baseData];

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
        writeGuestFavorites([]);
        pushToast(wasFavorite ? "Removed from favorites." : "Added to favorites.", "success");
      } catch (error) {
        console.error("[FavoritesProvider] Toggle failed", error);
        setItems(lastKnownItems.current);
        pushToast("Unable to update favorites. Please try again.", "error");
      } finally {
        setIsUpdating(false);
      }
    },
    [items, pushToast, user],
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

function mergeFavorites(primary: FavoriteItem[], secondary: FavoriteItem[]): FavoriteItem[] {
  const map = new Map<string, FavoriteItem>();
  primary.forEach((item) => map.set(item.productId, normalizeItem(item)));
  secondary.forEach((item) => {
    if (!map.has(item.productId)) {
      map.set(item.productId, normalizeItem(item));
    }
  });
  return Array.from(map.values()).sort((a, b) => (b.addedAt.toMillis?.() ?? 0) - (a.addedAt.toMillis?.() ?? 0));
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return ctx;
}
