"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "@/lib/motion";

import { AnimatedAddToCartButton } from "@/components/AnimatedAddToCartButton";
import { useCart } from "@/context/cart";
import { useFlyToCart } from "@/lib/useFlyToCart";

import { Product } from "@/types/product";
import { Swatch } from "./swatch";

type ProductWithInventory = Product & { stock?: number; inStock?: boolean };

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

const colorSwatchMap: Record<string, string> = {
  noir: "#1f2937",
  black: "#111827",
  blanc: "#f9fafb",
  white: "#f9fafb",
  gris: "#9ca3af",
  gray: "#9ca3af",
  rouge: "#dc2626",
  red: "#ef4444",
  bleu: "#2563eb",
  blue: "#2563eb",
  vert: "#16a34a",
  green: "#22c55e",
  beige: "#d6c9a5",
  beigeclair: "#e5d5b5",
};

type NormalizedColor = {
  hex: string;
  image?: string;
  label?: string;
};

const getSwatchColor = (color: NormalizedColor): string => {
  if (color.hex && /^#([0-9A-F]{3}){1,2}$/i.test(color.hex)) {
    return color.hex;
  }
  const label = color.label?.toLowerCase().replace(/\s+/g, "") ?? "";
  return colorSwatchMap[label] ?? color.hex ?? "#e5e7eb";
};

const normalizeColors = (colors: Product["colors"]): NormalizedColor[] =>
  colors.reduce<NormalizedColor[]>((acc, color) => {
    if (typeof color === "string") {
      acc.push({ hex: color, label: color });
      return acc;
    }
    if ("hex" in color) {
      const hex = typeof color.hex === "string" ? color.hex : "";
      const label = typeof color.labelFr === "string" ? color.labelFr : hex;
      const image = typeof color.image === "string" ? color.image : undefined;
      if (hex) acc.push({ hex, label, image });
      return acc;
    }
    const id = typeof color.id === "string" ? color.id : "";
    const label = typeof color.labelFr === "string" ? color.labelFr : id;
    const image = typeof color.image === "string" ? color.image : undefined;
    if (id) acc.push({ hex: id, label, image });
    return acc;
  }, []);

const skeletonShimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_ease_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

export type ProductCardProps = {
  product: ProductWithInventory;
  loading?: boolean;
};

function ProductCardComponent({ product, loading = false }: ProductCardProps) {
  const colorOptions = useMemo(() => normalizeColors(product.colors), [product.colors]);
  const colorOptionKey = useMemo(
    () => colorOptions.map((color) => `${color.hex}-${color.image ?? ""}`).join("|"),
    [colorOptions],
  );
  const initialColor = useMemo(
    () => (colorOptions.length === 1 ? colorOptions[0] : null),
    [colorOptions],
  );
  const sizeKey = useMemo(() => product.sizes.join("|"), [product.sizes]);
  const initialSize = useMemo(
    () => (product.sizes.length === 1 ? product.sizes[0] : null),
    [product.sizes],
  );
  const [selectedColor, setSelectedColor] = useState<NormalizedColor | null>(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);
  const images = useMemo(() => {
    const base = [product.images.main, ...(product.images.gallery ?? [])].filter(Boolean);
    return base.length > 0 ? base : [product.images.main];
  }, [product.images.gallery, product.images.main]);
  const { addItem, items } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const { flyToCart } = useFlyToCart();
  const stockCount = typeof product.stock === "number" ? product.stock : null;
  const isOutOfStock =
    product.inStock === false || (stockCount !== null && stockCount <= 0);
  const availableStock = stockCount ?? undefined;

  const currentImage = images[activeIndex] ?? images[0] ?? product.images.main;
  const nextImage = images.length > 0 ? images[(activeIndex + 1) % images.length] : product.images.main;
  const isSelectionMissing =
    (!selectedColor && colorOptions.length > 1) || (!selectedSize && product.sizes.length > 1);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedColor(initialColor);
    setSelectedSize(initialSize);
    setSelectionWarning(null);
  }, [colorOptionKey, initialColor, initialSize, product.slug, sizeKey]);

  const handleNav = useCallback(
    (
      direction: "prev" | "next",
      event?: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLAnchorElement>,
    ) => {
      event?.preventDefault();
      event?.stopPropagation();
      setActiveIndex((prev) =>
        direction === "prev"
          ? (prev - 1 + images.length) % images.length
          : (prev + 1) % images.length,
      );
    },
    [images.length],
  );

  const handleKeyNavigation = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === "ArrowLeft") {
        handleNav("prev", event);
      }
      if (event.key === "ArrowRight") {
        handleNav("next", event);
      }
    },
    [handleNav],
  );

  const handleTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0]?.clientX - touchStartX.current;
    const threshold = 24;

    if (deltaX > threshold) {
      handleNav("prev");
    } else if (deltaX < -threshold) {
      handleNav("next");
    }

    touchStartX.current = null;
  };

  const handleSelectColor = (color: NormalizedColor, index: number) => {
    setSelectedColor(color);
    setActiveIndex(Math.min(index, Math.max(images.length - 1, 0)));
    setSelectionWarning(null);
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    setSelectionWarning(null);
  };

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) {
      setSelectionWarning("Out of stock");
      return false;
    }

    if (!selectedColor && product.colors.length > 1) {
      setSelectionWarning("Please choose a color and size before adding to cart.");
      return false;
    }

    if (!selectedSize && product.sizes.length > 1) {
      setSelectionWarning("Please choose a color and size before adding to cart.");
      return false;
    }

    const color = selectedColor ?? colorOptions[0];
    const sizeChoice = selectedSize ?? product.sizes[0] ?? "Taille unique";
    const colorName = color?.label ?? color?.hex ?? "Standard";
    const colorCode = color?.hex ?? "default";

    const variantKey = `${product.id}-${colorCode}-${sizeChoice}`.toLowerCase();
    const existing = items.find((item) => item.variantKey === variantKey);
    const maxQty = existing?.maxQuantity ?? availableStock;
    if (typeof maxQty === "number" && maxQty > 0 && (existing?.quantity ?? 0) >= maxQty) {
      setSelectionWarning("Max stock reached");
      return false;
    }

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.nameFr,
      price: product.priceDzd,
      currency: product.currency,
      image: currentImage ?? product.images.main,
      colorName,
      colorCode,
      size: sizeChoice,
      quantity: 1,
      maxQuantity: availableStock ?? undefined,
    });

    setSelectionWarning(null);

    flyToCart(imageRef.current);
    return true;
  }, [
    addItem,
    currentImage,
    colorOptions,
    flyToCart,
    availableStock,
    isOutOfStock,
    items,
    product.colors,
    product.currency,
    product.id,
    product.images.main,
    product.nameFr,
    product.priceDzd,
    product.slug,
    product.sizes,
    selectedColor,
    selectedSize,
  ]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div
          className={`relative aspect-[4/3.6] w-full bg-white/10 sm:aspect-[5/4.4] lg:aspect-[5/4.6] ${skeletonShimmer}`}
        />
        <div className="space-y-3 p-4">
          <div className={`h-6 w-3/4 rounded-lg bg-white/10 ${skeletonShimmer}`} />
          <div className={`h-4 w-1/2 rounded-lg bg-white/10 ${skeletonShimmer}`} />
          <div className="flex gap-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-7 w-12 rounded-full bg-white/10 ${skeletonShimmer}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Product card height + controls tightening */}
      <motion.article
        whileHover={{ transform: "translateY(-4px)" }}
        transition={{ duration: 0.2, easing: "ease" }}
        className="product-card-shell relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/70 shadow-[0_10px_26px_rgba(0,0,0,0.3)]"
      >
        <Link
          href={`/shop/${product.slug}`}
          className="group relative flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={`Voir les détails du produit ${product.nameFr}`}
          onKeyDown={handleKeyNavigation}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="relative aspect-[3/4] w-full min-h-[270px] overflow-hidden bg-gradient-to-b from-white/10 via-white/0 to-white/5">
            {currentImage ? (
              <AnimatePresence>
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0.4, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, easing: "ease" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentImage}
                    alt={product.nameFr}
                    ref={imageRef}
                    fill
                    priority={false}
                    sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                </motion.div>
                {isHovering && images.length > 1 && (
                  <motion.div
                    key={`${currentImage}-hover`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, easing: "ease" }}
                    className="absolute inset-0"
                  >
                      <Image
                        src={nextImage}
                        alt={product.nameFr}
                        ref={imageRef}
                        fill
                        priority={false}
                        sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
                        className="h-full w-full object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <span className="flex h-full items-center justify-center text-slate-300 bg-white/10 w-full text-sm font-medium">No image</span>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute left-2.5 right-2.5 top-2.5 flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {(() => {
                  const isOutOfStock = !product.inStock || (product.stock !== undefined && product.stock <= 0);
                  return (
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] shadow-sm shadow-black/10 ${
                      isOutOfStock
                        ? "bg-red-500/90 text-white"
                        : "bg-white/90 text-emerald-700"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isOutOfStock ? "bg-white" : "bg-emerald-500"
                      }`} />
                      {isOutOfStock ? "Out of stock" : "In stock"}
                    </span>
                  );
                })()}
              </div>

            {images.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1.5">
                <motion.button
                  type="button"
                  onClick={(event) => handleNav("prev", event)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Voir l'image précédente"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  &#8249;
                </motion.button>
                <motion.button
                  type="button"
                  onClick={(event) => handleNav("next", event)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Voir l'image suivante"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  &#8250;
                </motion.button>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1 px-3 pb-1 pt-1">
            <h2 className="text-sm font-semibold leading-tight text-white line-clamp-2 sm:text-base">{product.nameFr}</h2>

            <div className="flex items-center justify-between gap-3">
              {product.discountPercent && product.discountPercent > 0 ? (
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-emerald-200 tabular-nums sm:text-lg">
                    {formatPrice(Math.max(product.priceDzd * (1 - product.discountPercent / 100), 0))}
                  </p>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                    -{product.discountPercent}%
                  </span>
                  <p className="text-xs font-semibold text-white/60 line-through">{formatPrice(product.priceDzd)}</p>
                </div>
              ) : (
                <p className="text-base font-bold text-white tabular-nums sm:text-lg">{formatPrice(product.priceDzd)}</p>
              )}
            </div>
          </div>
        </Link>

        <div className="space-y-1 px-3 pb-2">
          {colorOptions.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span>Color</span>
                {!selectedColor && colorOptions.length > 1 && (
                  <span className="text-rose-200">Pick a color</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {colorOptions.slice(0, 3).map((color, index) => {
                  const hexValue = getSwatchColor(color);
                  const label = color.label ?? color.hex ?? "Color";
                  return (
                    <Swatch
                      key={color.hex + index}
                      label={label}
                      colorHex={hexValue}
                      selected={selectedColor?.hex === color.hex}
                      onSelect={() => handleSelectColor(color, index)}
                      size="card"
                      showLabel={false}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span>Size</span>
                {!selectedSize && product.sizes.length > 1 && (
                  <span className="text-rose-200">Pick a size</span>
                )}
              </div>
              <div className="flex gap-1 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <motion.button
                      key={size}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleSelectSize(size);
                      }}
                      aria-pressed={isSelected}
                      className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                        isSelected
                          ? "border-white bg-white/15 text-white"
                          : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                      }`}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {size.toUpperCase()}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="min-h-[20px] text-xs text-rose-200" aria-live="polite">
            {selectionWarning ?? "\u00a0"}
          </p>

          <AnimatedAddToCartButton
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full justify-center ${
              isSelectionMissing || isOutOfStock ? "opacity-60 cursor-not-allowed" : ""
            }`.trim()}
          />
        </div>
      </motion.article>
    </>
  );
  }

export const ProductCard = memo(ProductCardComponent);
