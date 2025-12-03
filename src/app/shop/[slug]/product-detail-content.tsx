"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { Swatch } from "../swatch";
import { Product, ProductColor } from "@/types/product";

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
    product.colors[0],
  );
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes[0],
  );

  const imageList = useMemo(
    () => buildImageList(activeColor, [product.images.main, ...product.images.gallery]),
    [activeColor, product.images.gallery, product.images.main],
  );

  const currentImage = imageList[activeImage] ?? product.images.main;

  const handleThumbnailSelect = (index: number) => {
    setActiveImage(index);
  };

  const infoRows = [
    { label: "Fit", value: product.fit },
    { label: "Genre", value: product.gender },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 via-white/0 to-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.35)]">
            <div className="relative aspect-[4/5] w-full">
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
                    className="h-full w-full object-cover"
                    sizes="(min-width: 1024px) 40vw, 100vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {imageList.length > 1 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
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

        <div className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_12px_45px_rgba(0,0,0,0.35)]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Collection</p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{product.nameFr}</h1>
            <p className="text-lg font-semibold text-white">{formatPrice(product.priceDzd, product.currency)}</p>
            <p className="text-sm leading-relaxed text-neutral-300">{product.descriptionFr}</p>
          </div>

          <div className="space-y-3">
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
                  }}
                  size="md"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Tailles</h2>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <motion.button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
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

          <div className="space-y-3">
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
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Ajouter au panier"
            >
              Ajouter au panier
            </button>
            <p className="text-xs text-neutral-400">
              Livraison rapide & échanges simples.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
