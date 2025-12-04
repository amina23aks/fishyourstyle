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

import { Product, ProductCategory, ProductColor } from "@/types/product";
import { Swatch } from "./swatch";

const categoryLabels: Record<ProductCategory, string> = {
  hoodies: "Hoodie",
  pants: "Pantalon",
  tshirts: "Tshirt",
  sweatshirts: "Sweatshirt",
  ensembles: "Ensemble",
};

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

const getSwatchColor = (label: string) => {
  const key = label.toLowerCase().replace(/\s+/g, "");
  return colorSwatchMap[key] ?? "#e5e7eb";
};

const buildImageList = (product: Product, activeColor?: ProductColor | null): string[] => {
  const galleryImages = product.images.gallery ?? [];
  const withColor = activeColor?.image
    ? [activeColor.image, product.images.main, ...galleryImages]
    : [product.images.main, ...galleryImages];
  const uniqueImages = Array.from(new Set(withColor.filter(Boolean)));

  return uniqueImages.length > 0 ? uniqueImages : [product.images.main];
};

const skeletonShimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_ease_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

export type ProductCardProps = {
  product: Product;
  loading?: boolean;
};

function ProductCardComponent({ product, loading = false }: ProductCardProps) {
  const initialColor = product.colors.length === 1 ? product.colors[0] : null;
  const initialSize = product.sizes.length === 1 ? product.sizes[0] : null;
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);
  const images = useMemo(() => buildImageList(product, selectedColor), [product, selectedColor]);
  const { addItem } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const { flyToCart } = useFlyToCart();
  const categoryLabel = categoryLabels[product.category];
  const showCategoryBadge = !product.nameFr
    .toLowerCase()
    .includes(categoryLabel.toLowerCase());

  const currentImage = images[activeIndex];
  const nextImage = images[(activeIndex + 1) % images.length];
  const isSelectionMissing =
    (!selectedColor && product.colors.length > 1) || (!selectedSize && product.sizes.length > 1);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedColor(initialColor);
    setSelectedSize(initialSize);
    setSelectionWarning(null);
  }, [initialColor, initialSize, product.id]);

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

  const handleSelectColor = (color: ProductColor) => {
    setSelectedColor(color);
    setActiveIndex(0);
    setSelectionWarning(null);
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    setSelectionWarning(null);
  };

  const handleAddToCart = useCallback(() => {
    if (!selectedColor && product.colors.length > 1) {
      setSelectionWarning("Please choose a color and size before adding to cart.");
      return false;
    }

    if (!selectedSize && product.sizes.length > 1) {
      setSelectionWarning("Please choose a color and size before adding to cart.");
      return false;
    }

    const color = selectedColor ?? product.colors[0];
    const sizeChoice = selectedSize ?? product.sizes[0] ?? "Taille unique";
    const colorName = color?.labelFr ?? "Standard";
    const colorCode = color?.id ?? "default";

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.nameFr,
      price: product.priceDzd,
      currency: product.currency,
      image: color?.image ?? product.images.main,
      colorName,
      colorCode,
      size: sizeChoice,
      quantity: 1,
    });

    setSelectionWarning(null);

    flyToCart(imageRef.current);
    return true;
  }, [
    addItem,
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
    flyToCart,
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
          <div className="relative aspect-[4/3.6] w-full overflow-hidden bg-gradient-to-b from-white/10 via-white/0 to-white/5 sm:aspect-[5/4.4] lg:aspect-[5/4.6]">
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

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            <div className="absolute left-2.5 right-2.5 top-2.5 flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] text-emerald-700 shadow-sm shadow-black/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In stock
              </span>
              {showCategoryBadge && (
                <span className="w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white backdrop-blur">
                  {categoryLabel}
                </span>
              )}
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

          <div className="flex flex-1 flex-col gap-0.25 px-3 pb-1 pt-1">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold leading-tight text-white line-clamp-2 sm:text-base">{product.nameFr}</h2>
              <p className="text-[11px] text-neutral-400">{product.fit}</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-bold text-white tabular-nums sm:text-lg">{formatPrice(product.priceDzd)}</p>
            </div>
          </div>
        </Link>

        <div className="space-y-1 px-3 pb-2">
          {product.colors.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span>Color</span>
                {!selectedColor && product.colors.length > 1 && (
                  <span className="text-rose-200">Pick a color</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {product.colors.map((color) => (
                  <Swatch
                    key={color.id}
                    label={color.labelFr}
                    colorHex={getSwatchColor(color.labelFr)}
                    selected={selectedColor?.id === color.id}
                    onSelect={() => handleSelectColor(color)}
                    size="xs"
                    showLabel={false}
                  />
                ))}
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

          <p className="min-h-[18px] text-xs text-rose-200" aria-live="polite">
            {selectionWarning ?? ""}
          </p>

          <AnimatedAddToCartButton
            onClick={handleAddToCart}
            className={`w-full justify-center ${isSelectionMissing ? "opacity-80" : ""}`.trim()}
          />
        </div>
      </motion.article>
    </>
  );
  }

export const ProductCard = memo(ProductCardComponent);
