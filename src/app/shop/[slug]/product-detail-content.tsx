"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "@/lib/motion";

import { Swatch } from "../swatch";
import { Product } from "@/types/product";
import { useCart } from "@/context/cart";
import { AnimatedAddToCartButton } from "@/components/AnimatedAddToCartButton";
import { useFlyToCart } from "@/lib/useFlyToCart";

const formatPrice = (value: number, currency: Product["currency"]) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} ${currency}`;

type NormalizedColor = {
  id: string;
  labelFr: string;
  image?: string;
  labelAr?: string;
};

const normalizeColors = (colors: Product["colors"]): NormalizedColor[] =>
  colors.map((color) => {
    if (typeof color === "string") {
      return { id: color, labelFr: color, image: undefined };
    }
    return {
      id: color.id,
      labelFr: color.labelFr,
      image: color.image,
      labelAr: color.labelAr,
    };
  });

const buildImageList = (color: NormalizedColor | undefined, fallback: string[]) => {
  const galleryImages = color?.image ? [color.image, ...fallback] : fallback;
  const uniqueImages = Array.from(new Set(galleryImages.filter(Boolean)));
  return uniqueImages.length > 0 ? uniqueImages : fallback;
};

const swatchHex = (color: NormalizedColor): string => {
  // If color.id is a hex string, use it
  if (color.id && /^#([0-9A-F]{3}){1,2}$/i.test(color.id)) {
    return color.id;
  }
  
  // Otherwise, try to map from label
  const label = color.labelFr?.toLowerCase().replace(/\s+/g, "") ?? "";
  const map: Record<string, string> = {
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

  return map[label] ?? color.id ?? "#e5e7eb";
};

const sizeLabel = (size: string) => size.toUpperCase();
const capitalizeLabel = (value: string | undefined | null): string => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export function ProductDetailContent({ product }: { product: Product }) {
  const collectionName =
    product.designTheme && product.designTheme !== "basic"
      ? capitalizeLabel(product.designTheme)
      : capitalizeLabel(product.category);
  const colorOptions = normalizeColors(product.colors);
  const [activeColor, setActiveColor] = useState<NormalizedColor | undefined>(
    colorOptions.length === 1 ? colorOptions[0] : undefined,
  );
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes.length === 1 ? product.sizes[0] : undefined,
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { flyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement | null>(null);

  const imageList = useMemo(
    () => buildImageList(activeColor, [product.images.main, ...product.images.gallery]),
    [activeColor, product.images.gallery, product.images.main],
  );

  // Ensure currentImage always defaults to the first image or placeholder
  const currentImage = imageList[activeImage] ?? imageList[0] ?? product.images.main ?? "/placeholder.png";
  
  const handleAddToCart = () => {
    if (!activeColor && product.colors.length > 1) {
      setSelectionError("Please choose a color and size before adding to cart.");
      return false;
    }

    if (!selectedSize && product.sizes.length > 1) {
      setSelectionError("Please choose a color and size before adding to cart.");
      return false;
    }

    const colorName = activeColor?.labelFr ?? "Standard";
    const colorCode = activeColor?.id ?? "default";
    const size = selectedSize ?? "Taille unique";

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.nameFr,
      price: product.priceDzd,
      currency: product.currency,
      image: activeColor?.image ?? product.images.main,
      colorName,
      colorCode,
      size,
    });

    setSelectionError(null);
    flyToCart(imageRef.current);
    return true;
  };

  // Only show gender if it's explicitly set (not empty string)
  const infoRows = product.gender && product.gender.trim() !== "" ? [{ label: "Genre", value: product.gender }] : [];

  const isSelectionMissing =
    (!activeColor && colorOptions.length > 1) || (!selectedSize && product.sizes.length > 1);

  return (
    <main className="mx-auto max-w-5xl px-4 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-[340px] min-h-[420px] max-h-[450px] h-full flex items-center">
            {/* Product image as before, but fixed height */}
            <div className="w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 via-white/0 to-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
              <div className="relative w-full h-full aspect-[4/5]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImage}
                    initial={{ opacity: 0.5, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.4, scale: 0.98 }}
                    transition={{ duration: 0.35, easing: "ease" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={currentImage}
                      alt={product.nameFr}
                      fill
                      ref={imageRef}
                      className="object-cover h-full"
                      sizes="(min-width: 1024px) 42vw, 100vw"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-[1.05] flex flex-col w-full">
          <div className="flex-1 space-y-2 rounded-2xl border border-white/10 bg-black/40 p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)] sm:p-4 lg:p-4 lg:self-stretch h-full">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Collection</p>
              <p className="text-[13px] font-medium text-white/90 capitalize">{collectionName}</p>
              <h1 className="text-lg font-semibold text-white sm:text-xl leading-tight">{product.nameFr}</h1>
              {product.discountPercent && product.discountPercent > 0 ? (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-emerald-200 sm:text-xl">
                    {formatPrice(Math.max(product.priceDzd * (1 - product.discountPercent / 100), 0), product.currency)}
                  </p>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                    -{product.discountPercent}%
                  </span>
                  <p className="text-xs font-semibold text-white/60 line-through">
                    {formatPrice(product.priceDzd, product.currency)}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-white sm:text-xl">
                  {formatPrice(product.priceDzd, product.currency)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Coloris</h2>
              <div className="flex flex-wrap gap-1.5">
                {colorOptions.map((color) => {
                  const hexValue = swatchHex(color);
                  const label = color.labelFr ?? color.id ?? "Color";
                  return (
                    <Swatch
                      key={color.id}
                      label={label}
                      colorHex={hexValue}
                      selected={color.id === activeColor?.id}
                      onSelect={() => {
                        setActiveColor(color);
                        setActiveImage(0);
                        setSelectionError(null);
                      }}
                      size="xs"
                      showLabel={false}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Tailles</h2>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <motion.button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setSelectionError(null);
                      }}
                      aria-pressed={isSelected}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isSelected ? "border-white bg-white/20 text-white" : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"}`}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {sizeLabel(size)}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {(infoRows.length > 0 || (product.descriptionFr && product.descriptionFr.trim())) && (
              <div className="space-y-1.5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Détails</h2>
                {product.descriptionFr && product.descriptionFr.trim() && (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-sm leading-relaxed text-neutral-300 break-words">
                      {product.descriptionFr}
                    </p>
                  </div>
                )}
                {infoRows.length > 0 && (
                  <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {infoRows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90"
                      >
                        <span className="text-white/70">{row.label}</span>
                        <span className="font-semibold">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="min-h-[24px] text-sm text-rose-200" aria-live="polite">
              {selectionError ?? "\u00a0"}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AnimatedAddToCartButton
                onClick={handleAddToCart}
                className={`w-full justify-center sm:w-auto ${
                  isSelectionMissing ? "opacity-80" : ""
                }`.trim()}
              />
              <p className="text-xs text-neutral-400">Livraison rapide & échanges simples.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
