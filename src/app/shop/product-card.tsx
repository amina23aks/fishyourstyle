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
import { SoldOutTooltipWrapper } from "@/components/SoldOutTooltipWrapper";
import { useCart } from "@/context/cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useFlyToCart } from "@/lib/useFlyToCart";

import { Product } from "@/types/product";
import { Swatch } from "./swatch";
import {
  buildProductColorOptions,
  buildProductSizeOptions,
  hasAvailableVariants,
  resolveSwatchHex,
} from "@/lib/product-variants";

type ProductWithInventory = Product & { stock?: number; inStock?: boolean };

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

const skeletonShimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_ease_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

export type ProductCardProps = {
  product: ProductWithInventory;
  loading?: boolean;
};

function ProductCardComponent({ product, loading = false }: ProductCardProps) {
  const colorOptions = useMemo(() => buildProductColorOptions(product), [product]);
  const sizeOptions = useMemo(() => buildProductSizeOptions(product), [product]);
  const availableColors = useMemo(() => colorOptions.filter((color) => !color.soldOut), [colorOptions]);
  const availableSizes = useMemo(() => sizeOptions.filter((size) => !size.soldOut), [sizeOptions]);
  const colorOptionKey = useMemo(
    () => colorOptions.map((color) => `${color.hex}-${color.image ?? ""}`).join("|"),
    [colorOptions],
  );
  const initialColor = useMemo(
    () => (availableColors.length === 1 ? availableColors[0] : null),
    [availableColors],
  );
  const sizeKey = useMemo(() => sizeOptions.map((size) => size.value).join("|"), [sizeOptions]);
  const initialSize = useMemo(
    () => (sizeOptions.length === 1 && !sizeOptions[0].soldOut ? sizeOptions[0].value : null),
    [sizeOptions],
  );
  const [selectedColor, setSelectedColor] = useState<typeof colorOptions[number] | null>(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);
  const images = useMemo(() => {
    const base = [product.images.main, ...(product.images.gallery ?? [])].filter(Boolean);
    return base.length > 0 ? base : [product.images.main];
  }, [product.images.gallery, product.images.main]);
  const { addItem, items } = useCart();
  const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const { flyToCart } = useFlyToCart();
  const stockCount = typeof product.stock === "number" ? product.stock : null;
  const requiresColorSelection = availableColors.length > 1;
  const requiresSizeSelection = availableSizes.length > 1;
  const hasVariantAvailable = hasAvailableVariants(product);
  const isOutOfStock =
    product.inStock === false || (stockCount !== null && stockCount <= 0) || !hasVariantAvailable;
  const availableStock = stockCount ?? undefined;
  const selectedSizeOption = selectedSize ? sizeOptions.find((size) => size.value === selectedSize) : null;
  const isSelectionInvalid =
    isOutOfStock ||
    !hasVariantAvailable ||
    (!selectedColor && requiresColorSelection) ||
    (!selectedSize && requiresSizeSelection) ||
    Boolean(selectedColor?.soldOut) ||
    Boolean(selectedSizeOption?.soldOut);

  if (process.env.NODE_ENV !== "production") {
    // Surface variant state in development to verify sold-out flags per product card.
    console.log("[ProductCard] product", product.slug, {
      colors: colorOptions,
      sizes: sizeOptions,
    });
  }

  const currentImage = images[activeIndex] ?? images[0] ?? product.images.main;
  const nextImage = images.length > 0 ? images[(activeIndex + 1) % images.length] : product.images.main;
  const isSelectionMissing =
    (!selectedColor && requiresColorSelection) || (!selectedSize && requiresSizeSelection);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedColor(initialColor);
    setSelectedSize(initialSize);
    setSelectionWarning(null);
  }, [colorOptionKey, initialColor, initialSize, product.slug, sizeKey]);

  useEffect(() => {
    if (selectedColor && selectedColor.soldOut) {
      setSelectedColor(availableColors[0] ?? null);
      return;
    }
    if (!selectedColor && availableColors.length === 1) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor]);

  useEffect(() => {
    if (selectedSize && sizeOptions.some((size) => size.value === selectedSize && size.soldOut)) {
      setSelectedSize(availableSizes[0]?.value ?? null);
      return;
    }
    if (!selectedSize && availableSizes.length === 1) {
      setSelectedSize(availableSizes[0].value);
    }
  }, [availableSizes, selectedSize, sizeOptions]);

  const wishlistPrice = useMemo(
    () =>
      product.discountPercent && product.discountPercent > 0
        ? Math.max(product.priceDzd * (1 - product.discountPercent / 100), 0)
        : product.priceDzd,
    [product.discountPercent, product.priceDzd],
  );

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

  const handleSelectColor = (color: typeof colorOptions[number], index: number) => {
    if (color.soldOut) return;
    setSelectedColor(color);
    setActiveIndex(Math.min(index, Math.max(images.length - 1, 0)));
    setSelectionWarning(null);
  };

  const handleSelectSize = (size: string) => {
    if (sizeOptions.some((option) => option.value === size && option.soldOut)) return;
    setSelectedSize(size);
    setSelectionWarning(null);
  };

  const handleAddToCart = useCallback(() => {
    if (isSelectionInvalid) {
      const fallbackMessage = !hasVariantAvailable
        ? "Selected options are sold out"
        : "Please choose a color and size before adding to cart.";
      const message = isOutOfStock ? "Out of stock" : fallbackMessage;
      setSelectionWarning(message);
      return false;
    }

    const color = selectedColor ?? availableColors[0];
    if (!color) {
      setSelectionWarning("Selected options are sold out");
      return false;
    }
    const sizeChoice = selectedSize ?? availableSizes[0]?.value ?? sizeOptions[0]?.value ?? "Taille unique";
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
    availableColors,
    flyToCart,
    availableStock,
    hasVariantAvailable,
    isOutOfStock,
    isSelectionInvalid,
    items,
    product.currency,
    product.id,
    product.images.main,
    product.nameFr,
    product.priceDzd,
    product.slug,
    sizeOptions,
    availableSizes,
    selectedColor,
    selectedSize,
  ]);

  const handleToggleWishlist = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const colorName = selectedColor?.label ?? selectedColor?.hex;
      const colorCode = selectedColor?.hex;
      const sizeValue = selectedSize ?? undefined;
      const variantKey =
        colorCode && sizeValue
          ? `${product.id}-${colorCode}-${sizeValue}`.toLowerCase()
          : colorCode || sizeValue
            ? `${product.id}-${colorCode ?? ""}-${sizeValue ?? ""}`.toLowerCase()
            : undefined;

      await toggleWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.nameFr,
        image: currentImage ?? product.images.main,
        price: wishlistPrice,
        currency: product.currency,
        colorName,
        colorCode,
        size: sizeValue,
        variantKey,
      });
    },
    [
      currentImage,
      product.currency,
      product.id,
      product.images.main,
      product.nameFr,
      product.slug,
      selectedColor,
      selectedSize,
      toggleWishlist,
      wishlistPrice,
    ],
  );

  const activeVariantKey =
    selectedColor || selectedSize
      ? `${product.id}-${selectedColor?.hex ?? ""}-${selectedSize ?? ""}`.toLowerCase()
      : product.id.toLowerCase();
  const isWishlisted = isInWishlist(
    product.id,
    activeVariantKey,
    selectedColor?.label ?? selectedColor?.hex,
    selectedSize ?? undefined,
  );

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

              <div className="absolute left-2.5 right-2.5 top-2.5 flex items-start justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-white">
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

                <motion.button
                  type="button"
                  onClick={handleToggleWishlist}
                  aria-pressed={isWishlisted}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  disabled={wishlistLoading}
                  whileTap={{ scale: 0.94 }}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-white shadow-md shadow-black/30 transition ${
                    isWishlisted
                      ? "border-rose-200/80 bg-rose-500/80"
                      : "border-white/20 bg-black/50 hover:border-white/40 hover:bg-black/70"
                  } ${wishlistLoading ? "opacity-70" : ""}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={isWishlisted ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5 drop-shadow-sm"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21s-6.5-3.94-9-8.14C1 9.5 2.5 5 6.5 5A5.5 5.5 0 0 1 12 8.5 5.5 5.5 0 0 1 17.5 5C21.5 5 23 9.5 21 12.86 18.5 17.06 12 21 12 21Z"
                    />
                  </svg>
                </motion.button>
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
                  const hexValue = resolveSwatchHex(color);
                  const label = color.label ?? color.hex ?? "Color";
                  const isSoldOut = color.soldOut;
                  return (
                    <Swatch
                      key={color.hex + index}
                      label={label}
                      colorHex={hexValue}
                      selected={selectedColor?.hex === color.hex}
                      onSelect={() => {
                        if (isSoldOut) return;
                        handleSelectColor(color, index);
                      }}
                      size="card"
                      showLabel={false}
                      disabled={isSoldOut}
                      isSoldOut={isSoldOut}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span>Size</span>
                {!selectedSize && requiresSizeSelection && (
                  <span className="text-rose-200">Pick a size</span>
                )}
              </div>
              <div className="flex gap-1 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
                {sizeOptions.map((size) => {
                  const isSelected = selectedSize === size.value;
                  const isSoldOut = size.soldOut;
                  return (
                    <SoldOutTooltipWrapper key={size.value} isSoldOut={isSoldOut} className="inline-flex">
                      <motion.button
                        type="button"
                        disabled={isSoldOut}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (isSoldOut) return;
                          handleSelectSize(size.value);
                        }}
                        aria-pressed={isSelected}
                        aria-disabled={isSoldOut}
                        className={`relative whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                          isSelected
                            ? "border-white bg-white/15 text-white"
                            : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                        } ${isSoldOut ? "opacity-60 cursor-not-allowed" : ""}`}
                        whileHover={isSoldOut ? undefined : { y: -1 }}
                        whileTap={isSoldOut ? undefined : { scale: 0.97 }}
                      >
                        <span className="relative inline-flex items-center justify-center">
                          {size.value.toUpperCase()}
                          {isSoldOut ? (
                            <>
                              <span className="pointer-events-none absolute h-[2px] w-5 -rotate-45 bg-red-400/80 mix-blend-multiply" />
                              <span className="pointer-events-none absolute h-[2px] w-5 rotate-45 bg-red-400/80 mix-blend-multiply" />
                            </>
                          ) : null}
                        </span>
                      </motion.button>
                    </SoldOutTooltipWrapper>
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
            disabled={isSelectionInvalid}
            className={`w-full justify-center ${
              isSelectionMissing || isSelectionInvalid ? "opacity-60 cursor-not-allowed" : ""
            }`.trim()}
          />
        </div>
      </motion.article>
    </>
  );
  }

export const ProductCard = memo(ProductCardComponent);
