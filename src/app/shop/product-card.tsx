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

import { useCart } from "@/context/cart";

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

type FlyToken = {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  image: string;
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
  const [justAdded, setJustAdded] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);
  const [flyers, setFlyers] = useState<FlyToken[]>([]);
  const touchStartX = useRef<number | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const categoryLabel = categoryLabels[product.category];
  const showCategoryBadge = !product.nameFr
    .toLowerCase()
    .includes(categoryLabel.toLowerCase());

  const currentImage = images[activeIndex];
  const nextImage = images[(activeIndex + 1) % images.length];

  useEffect(() => {
    setActiveIndex(0);
    setJustAdded(false);
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

  const handleAddToCart = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!selectedColor && product.colors.length > 1) {
        setSelectionWarning("Please choose a color and size before adding to cart.");
        return;
      }

      if (!selectedSize && product.sizes.length > 1) {
        setSelectionWarning("Please choose a color and size before adding to cart.");
        return;
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
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);

    const buttonRect = addButtonRef.current?.getBoundingClientRect();
    const cartTarget = document.querySelector('[data-cart-target="true"]') as HTMLElement | null;
    const cartRect = cartTarget?.getBoundingClientRect();

    if (buttonRect && cartRect) {
      const newFlyer: FlyToken = {
        id: Date.now(),
        x: buttonRect.left + buttonRect.width / 2,
        y: buttonRect.top + buttonRect.height / 2,
        targetX: cartRect.left + cartRect.width / 2,
        targetY: cartRect.top + cartRect.height / 2,
        image: color?.image ?? product.images.main,
      };
      setFlyers((previous) => [...previous, newFlyer]);
    }
  },
  [
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
    ],
  );

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div
          className={`relative aspect-[3/4] w-full bg-white/10 ${skeletonShimmer}`}
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
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-white/10 via-white/0 to-white/5 sm:aspect-[5/7] lg:aspect-[4/5]">
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

          <div className="flex flex-1 flex-col gap-0.25 px-3 pb-1.25 pt-1.5">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold leading-tight text-white line-clamp-2">{product.nameFr}</h2>
              <p className="text-[11px] text-neutral-400">{product.fit}</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white tabular-nums">{formatPrice(product.priceDzd)}</p>
            </div>
          </div>
        </Link>

        <div className="space-y-1.25 px-3 pb-2.5">
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

          {selectionWarning && (
            <p className="text-xs text-rose-200" aria-live="polite">
              {selectionWarning}
            </p>
          )}

          <motion.button
            type="button"
            onClick={handleAddToCart}
            whileTap={{ scale: 0.97 }}
            whileHover={{ transform: "translateY(-2px)" }}
            ref={addButtonRef}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-teal-900/30 transition hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Add to cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-[18px] w-[18px]"
              aria-hidden
            >
              <path d="M4 6h17l-1.5 7.2a2 2 0 0 1-2 1.6H9.4a2 2 0 0 1-2-1.6L6.6 3.8H3.5" />
              <path d="M11.8 3.8h6.5" />
              <path d="M12 11.5v4.4m-2.4-2.2H14.4" />
              <circle cx="10.4" cy="20" r="1.05" />
              <circle cx="16" cy="20" r="1.05" />
            </svg>
            {justAdded ? "Added" : "Add to cart"}
          </motion.button>
        </div>
      </motion.article>

      <AnimatePresence>
        {flyers.map((flyer) => (
          <motion.div
            key={flyer.id}
            initial={{ x: flyer.x, y: flyer.y, scale: 0.9, opacity: 0.9 }}
            animate={{ x: flyer.targetX, y: flyer.targetY, scale: 0.25, opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            className="pointer-events-none fixed z-50"
            onAnimationComplete={() =>
              setFlyers((previous) => previous.filter((item) => item.id !== flyer.id))
            }
          >
            <div
              className="h-12 w-12 rounded-full border border-white/40 bg-white/80 shadow-lg shadow-black/30"
              style={{
                backgroundImage: `url(${flyer.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
  }

export const ProductCard = memo(ProductCardComponent);
