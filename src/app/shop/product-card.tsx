"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

import { Product, ProductCategory } from "@/types/product";

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
  blanc: "#f3f4f6",
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
  return colorSwatchMap[key] ?? "#d1d5db";
};

const buildImageList = (product: Product) => {
  const galleryImages = product.images.gallery ?? [];
  const uniqueImages = Array.from(new Set([product.images.main, ...galleryImages]));

  return uniqueImages.length > 0 ? uniqueImages : [product.images.main];
};

export function ProductCard({ product }: { product: Product }) {
  const images = useMemo(() => buildImageList(product), [product]);
  const [activeIndex, setActiveIndex] = useState(0);

  const mainImage = images[activeIndex];
  const hoverImage = images[(activeIndex + 1) % images.length];

  const goToPrev = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-white/10 via-white/0 to-white/5">
        <Image
          src={mainImage}
          alt={product.nameFr}
          fill
          priority={false}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-opacity duration-300 group-hover:opacity-0"
        />

        <Image
          src={hoverImage}
          alt={product.nameFr}
          fill
          priority={false}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        <div className="absolute inset-x-4 top-4 flex items-center justify-between text-xs font-semibold text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-wide text-black shadow-sm shadow-black/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Back in stock
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] uppercase tracking-wide text-white/90 backdrop-blur">
            {categoryLabels[product.category]}
          </span>
        </div>

        {images.length > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={goToPrev}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Voir l'image précédente"
            >
              &#8249;
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Voir l'image suivante"
            >
              &#8250;
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white line-clamp-2">{product.nameFr}</h2>
          <p className="text-xs text-neutral-400">{product.fit}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">{formatPrice(product.priceDzd)}</p>
          {product.colors.length > 0 && (
            <div className="flex items-center gap-2">
              {product.colors.map((color) => (
                <span
                  key={color.id}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/60 shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                  style={{ backgroundColor: getSwatchColor(color.labelFr) }}
                  title={color.labelFr}
                >
                  <span className="sr-only">{color.labelFr}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
