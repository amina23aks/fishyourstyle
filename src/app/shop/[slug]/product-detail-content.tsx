"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    product.designTheme && product.designTheme !== "simple"
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

  const allImages = useMemo(
    () => [product.images.main, ...product.images.gallery].filter(Boolean),
    [product.images.gallery, product.images.main],
  );

  const imageList = useMemo(() => {
    const galleryImages = activeColor?.image ? [activeColor.image, ...allImages] : allImages;
    const uniqueImages = Array.from(new Set(galleryImages.filter(Boolean)));
    return uniqueImages.length > 0 ? uniqueImages : allImages;
  }, [activeColor?.image, allImages]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && product.images.gallery.length > 0) {
      console.debug(
        `Product ${product.slug} has ${product.images.gallery.length} gallery images ready for thumbnails.`,
      );
    }
  }, [product.images.gallery.length, product.slug]);

  useEffect(() => {
    if (activeImage >= imageList.length) {
      setActiveImage(0);
    }
  }, [activeImage, imageList.length]);

  // Ensure currentImage always defaults to the first image or placeholder
  const currentImage =
    imageList[activeImage] ??
    imageList[0] ??
    allImages[0] ??
    product.images.main ??
    "/placeholder.png";
  
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
    <main className="mx-auto max-w-6xl px-4 lg:px-8 py-6">
      <div className="grid gap-6 items-start lg:grid-cols-[120px_minmax(0,1fr)_360px]">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
            {imageList.length > 1 && (
              <div className="order-2 flex w-full gap-2 overflow-x-auto pb-1 lg:order-1 lg:w-[104px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2 lg:pb-0">
                {imageList.map((url, index) => {
                  const isActive = index === activeImage;
                  return (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`group relative flex-shrink-0 overflow-hidden rounded-2xl border border-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                        isActive ? "ring-2 ring-white/80 border-white/70" : "bg-black/30 hover:border-white/40"
                      } h-20 w-16 lg:h-[96px] lg:w-full`}
                      aria-label={`Afficher l'image ${index + 1}`}
                    >
                      <Image
                        src={url}
                        alt={`${product.nameFr} vignette ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="order-1 flex w-full justify-center lg:order-2 lg:pl-1">
              <div className="relative aspect-[4/5] w-full max-w-[720px] overflow-hidden rounded-3xl border border-white/12 bg-black/40 shadow-[0_18px_38px_rgba(0,0,0,0.35)]">
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
                      className="object-cover"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/45 p-5 shadow-[0_10px_28px_rgba(0,0,0,0.32)]">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Collection</p>
            <p className="text-xs font-medium text-white/90 capitalize">{collectionName}</p>
            <h1 className="text-xl font-semibold text-white leading-tight sm:text-2xl">{product.nameFr}</h1>
            {product.discountPercent && product.discountPercent > 0 ? (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-emerald-200 sm:text-[26px]">
                  {formatPrice(Math.max(product.priceDzd * (1 - product.discountPercent / 100), 0), product.currency)}
                </p>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-100">
                  -{product.discountPercent}%
                </span>
                <p className="text-sm font-semibold text-white/60 line-through">
                  {formatPrice(product.priceDzd, product.currency)}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white sm:text-[26px]">
                {formatPrice(product.priceDzd, product.currency)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-white/80">Coloris</h2>
            <div className="flex flex-wrap gap-2">
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
                    size="sm"
                    showLabel={false}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-white/80">Tailles</h2>
            <div className="flex flex-wrap gap-2">
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
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isSelected ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"}`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {sizeLabel(size)}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {(infoRows.length > 0 || (product.descriptionFr && product.descriptionFr.trim())) && (
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-white/80">Détails</h2>
                {product.descriptionFr && product.descriptionFr.trim() && (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-[13px] leading-relaxed text-neutral-300 break-words">
                      {product.descriptionFr}
                    </p>
                  </div>
                )}
                {infoRows.length > 0 && (
                  <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {infoRows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/90"
                      >
                        <span className="text-white/70">{row.label}</span>
                        <span className="font-semibold">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="min-h-[18px] text-[13px] text-rose-200" aria-live="polite">
              {selectionError ?? "\u00a0"}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AnimatedAddToCartButton
                onClick={handleAddToCart}
                className={`w-full justify-center sm:w-auto ${
                  isSelectionMissing ? "opacity-80" : ""
                }`.trim()}
              />
              <p className="text-[11px] text-neutral-400">Livraison rapide & échanges simples.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
