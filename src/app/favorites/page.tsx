"use client";

import Image from "next/image";
import Link from "next/link";

import { FavoriteButton } from "@/components/FavoriteButton";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteItem } from "@/types/favorites";

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

function formatAddedDate(item: FavoriteItem) {
  const millis = item.addedAt?.toMillis?.() ?? Date.now();
  const date = new Date(millis);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function FavoriteCard({ item }: { item: FavoriteItem }) {
  const { addItem } = useCart();
  const isOutOfStock = !item.inStock;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      id: item.productId,
      slug: item.slug || item.productId,
      name: item.name,
      price: item.price,
      currency: item.currency,
      image: item.image || "/placeholder.png",
      colorName: "Standard",
      colorCode: "default",
      size: "Taille unique",
      maxQuantity: isOutOfStock ? 0 : 5,
    });
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80 shadow-2xl shadow-sky-900/60">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5 text-sm text-white/70">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${
              isOutOfStock ? "bg-rose-500/90 text-white" : "bg-emerald-400/90 text-emerald-950"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? "bg-white" : "bg-emerald-700"}`} />
            {isOutOfStock ? "Out of stock" : "In stock"}
          </span>
          <FavoriteButton productId={item.productId} size="sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white line-clamp-2">{item.name}</h3>
          <p className="text-sm font-semibold text-amber-200">{formatPrice(item.price)}</p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex gap-2">
            <Link
              href={`/shop/${item.slug || item.productId}`}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              View product
            </Link>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isOutOfStock
                  ? "cursor-not-allowed bg-white/10 text-white/50"
                  : "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 hover:from-sky-300 hover:to-cyan-200"
              }`}
            >
              {isOutOfStock ? "Out of stock" : "Add to cart"}
            </button>
          </div>
          <p className="text-xs text-white/60">Added {formatAddedDate(item)}</p>
        </div>
      </div>
    </div>
  );
}

function FavoritesEmpty({ signedOut }: { signedOut?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-white shadow-lg shadow-black/30 backdrop-blur">
      <p className="text-xl font-semibold">
        {signedOut ? "Sign in to see your favorites." : "Your favorites list is empty."}
      </p>
      <p className="text-sm text-white/70">
        {signedOut ? "Log in to save products you love." : "Tap the heart on any product to save it here."}
      </p>
      <Link
        href="/shop"
        className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-cyan-500/30 transition hover:from-sky-300 hover:to-cyan-200"
      >
        Go to shop
      </Link>
    </div>
  );
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, isLoading } = useFavorites();

  const loadingState = authLoading || isLoading;
  const showEmpty = !loadingState && (!user || items.length === 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Favorites</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Your favorites</h1>
        <p className="text-sm text-white/70">
          Save items you love and add them to your cart when you&apos;re ready.
        </p>
      </div>

      {loadingState ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-3xl border border-white/10 bg-white/5"
            >
              <div className="aspect-[4/3] w-full bg-white/10" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="h-10 w-full rounded-xl bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : showEmpty ? (
        <FavoritesEmpty signedOut={!user} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <FavoriteCard key={item.productId} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
