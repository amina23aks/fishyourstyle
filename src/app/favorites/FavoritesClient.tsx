"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { motion } from "@/lib/motion";

import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";
import { useFavorites } from "@/hooks/use-favorites";
import { buildProductColorOptions, buildProductSizeOptions, normalizeHexValue } from "@/lib/product-variants";
import type { Product } from "@/types/product";
import type { FavoriteItem } from "@/types/favorites";
import { FavoriteButton } from "@/components/FavoriteButton";

type FavoritesClientProps = {
  products: Product[];
};

const formatPrice = (value: number, currency: string) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} ${currency}`;

const fallbackVariant = (product: Product | undefined, item: FavoriteItem) => {
  const colorCode = item.colorCode ?? item.colorName ?? "default";
  const colorName = item.colorName ?? item.colorCode ?? "Standard";
  const size = item.size ?? product?.sizes?.[0] ?? "Taille unique";
  const variantKey = item.variantKey ?? `${item.productId}-${colorCode}-${size}`.toLowerCase();
  return { colorCode, colorName, size, variantKey };
};

function FavoriteCard({
  item,
  product,
  onAddToCart,
  onToggle,
  isSaved,
  isAvailable,
}: {
  item: FavoriteItem;
  product?: Product;
  onAddToCart: (item: FavoriteItem, product?: Product) => void;
  onToggle: (item: FavoriteItem) => void;
  isSaved: boolean;
  isAvailable: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_26px_rgba(0,0,0,0.35)]">
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-b from-white/5 via-black/10 to-black/40">
        <Image
          src={item.image || product?.images.main || "/placeholder.png"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 300px, 100vw"
        />
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              isAvailable ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-300/40" : "bg-rose-500/20 text-rose-50 ring-1 ring-rose-200/30"
            }`}
          >
            {isAvailable ? "Available" : "Check availability"}
          </span>
          <FavoriteButton active={isSaved} onClick={() => onToggle(item)} size="sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white line-clamp-2">{item.name}</h3>
          <p className="text-sm font-semibold text-emerald-100">{formatPrice(item.price, item.currency)}</p>
          <p className="text-xs text-neutral-300">
            {item.colorName ? <span className="mr-2 rounded-full bg-white/5 px-2 py-1 text-[11px] text-white/90">Color: {item.colorName}</span> : null}
            {item.size ? <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-white/90">Size: {item.size}</span> : null}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/shop/${item.slug}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-inner shadow-black/30 transition hover:border-white/30 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              View product
            </Link>
            <motion.button
              type="button"
              onClick={() => onAddToCart(item, product)}
              disabled={!isAvailable}
              whileTap={isAvailable ? { scale: 0.97 } : undefined}
              className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                isAvailable
                  ? "border border-white/20 bg-gradient-to-r from-sky-500/70 to-indigo-500/70 text-white"
                  : "border border-white/10 bg-white/5 text-white/70 opacity-75 cursor-not-allowed"
              }`}
            >
              Add to cart
            </motion.button>
          </div>
          <p className="text-[11px] text-neutral-400">Added {new Date(item.addedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export function FavoritesClient({ products }: FavoritesClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const { favorites, isLoading, toggleFavorite, isFavorite } = useFavorites();

  const productLookup = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => {
      map.set(product.id, product);
      map.set(product.slug, product);
    });
    return map;
  }, [products]);

  const checkAvailability = useCallback(
    (item: FavoriteItem) => {
      const product = productLookup.get(item.productId) ?? productLookup.get(item.slug);
      if (!product) return true;
      if (product.inStock === false || (typeof product.stock === "number" && product.stock <= 0)) {
        return false;
      }

      const colors = buildProductColorOptions(product);
      const sizes = buildProductSizeOptions(product);
      const normalizedColor = item.colorCode ? normalizeHexValue(item.colorCode) : null;
      const colorAvailable = normalizedColor
        ? colors.some((color) => normalizeHexValue(color.hex) === normalizedColor && !color.soldOut)
        : true;
      const sizeAvailable = item.size
        ? sizes.some((size) => size.value.toLowerCase() === item.size?.toLowerCase() && !size.soldOut)
        : true;

      return colorAvailable && sizeAvailable;
    },
    [productLookup],
  );

  const handleAddToCart = useCallback(
    (item: FavoriteItem, productOverride?: Product) => {
      const product = productOverride ?? productLookup.get(item.productId) ?? productLookup.get(item.slug);
      if (!product) return;
      const variant = fallbackVariant(product, item);
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.nameFr,
        price: item.price ?? product.priceDzd,
        currency: product.currency,
        image: item.image || product.images.main,
        colorName: variant.colorName,
        colorCode: variant.colorCode,
        size: variant.size,
        quantity: 1,
        maxQuantity: typeof product.stock === "number" && product.stock > 0 ? product.stock : 1,
        variantKey: variant.variantKey,
      });
    },
    [addItem, productLookup],
  );

  const handleToggleFavorites = useCallback(
    async (item: FavoriteItem) => {
      const fallback = fallbackVariant(productLookup.get(item.productId), item);
      await toggleFavorite({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        image: item.image,
        price: item.price,
        currency: item.currency,
        colorName: item.colorName,
        colorCode: item.colorCode,
        size: item.size,
        variantKey: item.variantKey ?? fallback.variantKey,
      });
    },
    [productLookup, toggleFavorite],
  );

  const isAuthenticated = Boolean(user);
  const showEmpty = !isLoading && favorites.length === 0;

  return (
    <PageShell>
      <section className="space-y-4 py-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Favorites</h1>
          <p className="text-sky-100/80">View and manage the products you’ve saved.</p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur">
          {!isAuthenticated && !authLoading ? (
            <div className="space-y-3 text-center text-white">
              <p className="text-lg font-semibold">Please log in to see your favorites.</p>
              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-inner shadow-black/30 transition hover:border-white/40 hover:bg-white/15"
              >
                Go to account
              </Link>
            </div>
          ) : isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 rounded-2xl border border-white/10 bg-white/5 shadow-inner shadow-black/30 animate-pulse"
                />
              ))}
            </div>
          ) : showEmpty ? (
            <div className="space-y-3 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white shadow-inner shadow-black/30">
              <p className="text-lg font-semibold">Your favorites list is empty.</p>
              <p className="text-sm text-sky-100/80">
                Start exploring the shop and tap the heart on products you like.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-inner shadow-black/30 transition hover:border-white/40 hover:bg-white/15"
              >
                Go to shop
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((item) => {
                const product = productLookup.get(item.productId) ?? productLookup.get(item.slug);
                const fallback = fallbackVariant(product, item);
                const variantKey = item.variantKey ?? fallback.variantKey;
                const isSaved = isFavorite(item.productId, variantKey);
                const isAvailable = checkAvailability(item);
                return (
                  <FavoriteCard
                    key={`${item.productId}-${variantKey}`}
                    item={item}
                    product={product}
                    isSaved={isSaved}
                    isAvailable={isAvailable}
                    onAddToCart={handleAddToCart}
                    onToggle={handleToggleFavorites}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
