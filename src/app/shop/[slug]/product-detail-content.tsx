"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "@/lib/motion";

import { Swatch } from "../swatch";
import { Product, ProductColor } from "@/types/product";
import { useCart } from "@/context/cart";
import { AnimatedAddToCartButton } from "@/components/AnimatedAddToCartButton";
import { useFlyToCart } from "@/lib/useFlyToCart";

const formatPrice = (value: number, currency: Product["currency"]) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} ${currency}`;

const buildImageList = (color: ProductColor | undefined, fallback: string[]) => {
  const galleryImages = color?.image ? [color.image, ...fallback] : fallback;
  const uniqueImages = Array.from(new Set(galleryImages.filter(Boolean)));
  return uniqueImages.length > 0 ? uniqueImages : fallback;
};

const swatchHex = (color: ProductColor) => {
  const label = color.labelFr.toLowerCase().replace(/\s+/g, "");
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

  return map[label] ?? "#e5e7eb";
};

const sizeLabel = (size: string) => size.toUpperCase();

export function ProductDetailContent({ product }: { product: Product }) {
  const [activeColor, setActiveColor] = useState<ProductColor | undefined>(
    product.colors.length === 1 ? product.colors[0] : undefined,
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

  const currentImage = imageList[activeImage] ?? product.images.main;

  const handleThumbnailSelect = (index: number) => {
    setActiveImage(index);
  };

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

  const infoRows = [{ label: "Genre", value: product.gender }];

  const isSelectionMissing =
    (!activeColor && product.colors.length > 1) || (!selectedSize && product.sizes.length > 1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[108px_minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        {imageList.length > 1 && (
          <div className="hidden lg:flex lg:flex-col lg:gap-3 lg:self-start">
            {imageList.map((image, index) => {
              const isActive = index === activeImage;
              return (
                <button
                  key={image}
                  type="button"
                  aria-label={`Voir l'image ${index + 1}`}
                  onClick={() => handleThumbnailSelect(index)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${isActive ? "border-white" : "border-white/10 hover:border-white/40"}`}
                >
                  <Image
                    src={image}
                    alt={`${product.nameFr} miniature ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                  <span className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" aria-hidden />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 via-white/0 to-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
            <div className="relative aspect-[4/5.2] w-full sm:aspect-[4/5.4] lg:aspect-[4/5.3]">
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
                    className="h-full w-full object-cover"
                    sizes="(min-width: 1024px) 42vw, 100vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {imageList.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:hidden">
              {imageList.map((image, index) => {
                const isActive = index === activeImage;
                return (
                  <button
                    key={image}
                    type="button"
                    aria-label={`Voir l'image ${index + 1}`}
                    onClick={() => handleThumbnailSelect(index)}
                    className={`group relative aspect-square overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${isActive ? "border-white" : "border-white/10 hover:border-white/40"}`}
                  >
                    <Image
                      src={image}
                      alt={`${product.nameFr} miniature ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                    <span className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" aria-hidden />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex h-full flex-col justify-between space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] sm:p-5 lg:self-stretch">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Collection</p>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{product.nameFr}</h1>
            <p className="text-xl font-bold text-white sm:text-2xl">{formatPrice(product.priceDzd, product.currency)}</p>
            <p className="text-sm leading-relaxed text-neutral-300">{product.descriptionFr}</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Coloris</h2>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <Swatch
                  key={color.id}
                  label={color.labelFr}
                  colorHex={swatchHex(color)}
                  selected={color.id === activeColor?.id}
                  onSelect={() => {
                    setActiveColor(color);
                    setActiveImage(0);
                    setSelectionError(null);
                  }}
                  size="md"
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Tailles</h2>
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
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isSelected ? "border-white bg-white/15 text-white" : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"}`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {sizeLabel(size)}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Détails</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {infoRows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90"
                >
                  <span className="text-white/70">{row.label}</span>
                  <span className="font-semibold">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AnimatedAddToCartButton
              onClick={handleAddToCart}
              className={`w-full justify-center sm:w-auto ${
                isSelectionMissing ? "opacity-80" : ""
              }`.trim()}
            />
            <p className="text-xs text-neutral-400">Livraison rapide & échanges simples.</p>
          </div>

          <p className="min-h-[24px] text-sm text-rose-200" aria-live="polite">
            {selectionError ?? "\u00a0"}
          </p>
        </div>
      </div>
    </main>
  );
}
