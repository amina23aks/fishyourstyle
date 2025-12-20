"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "@/lib/motion";

import { Swatch } from "../swatch";
import { Product } from "@/types/product";
import { useCart } from "@/context/cart";
import { AnimatedAddToCartButton } from "@/components/AnimatedAddToCartButton";
import { SoldOutMark } from "@/components/SoldOutMark";
import { useFlyToCart } from "@/lib/useFlyToCart";
import {
  buildProductColorOptions,
  buildProductSizeOptions,
  hasAvailableVariants,
  resolveSwatchHex,
} from "@/lib/product-variants";

const formatPrice = (value: number, currency: Product["currency"]) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} ${currency}`;

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
  const colorOptions = useMemo(() => buildProductColorOptions(product), [product]);
  const sizeOptions = useMemo(() => buildProductSizeOptions(product), [product]);
  const availableColors = useMemo(
    () => colorOptions.filter((color) => !color.soldOut),
    [colorOptions],
  );
  const availableSizes = useMemo(
    () => sizeOptions.filter((size) => !size.soldOut),
    [sizeOptions],
  );
  const [activeColor, setActiveColor] = useState<typeof colorOptions[number] | undefined>(() =>
    availableColors.length === 1 ? availableColors[0] : undefined,
  );
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(() =>
    availableSizes.length === 1 ? availableSizes[0].value : undefined,
  );
  const requiresColorSelection = availableColors.length > 1;
  const requiresSizeSelection = availableSizes.length > 1;
  const hasVariantAvailable = hasAvailableVariants(product);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { addItem, items } = useCart();
  const { flyToCart } = useFlyToCart();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const stockCount = typeof product.stock === "number" ? product.stock : null;
  const isOutOfStock =
    product.inStock === false || (stockCount !== null && stockCount <= 0);
  const availableStock = stockCount ?? undefined;

  const allImages = useMemo(
    () => [product.images.main, ...product.images.gallery].filter(Boolean),
    [product.images.gallery, product.images.main],
  );

  const imageList = useMemo(() => (allImages.length > 0 ? allImages : [product.images.main]), [allImages, product.images.main]);

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

  useEffect(() => {
    if (activeColor && activeColor.soldOut) {
      setActiveColor(availableColors[0]);
      return;
    }
    if (!activeColor && availableColors.length === 1) {
      setActiveColor(availableColors[0]);
    }
  }, [activeColor, availableColors]);

  useEffect(() => {
    if (selectedSize && availableSizes.every((size) => size.value !== selectedSize)) {
      setSelectedSize(availableSizes[0]?.value);
      return;
    }
    if (!selectedSize && availableSizes.length === 1) {
      setSelectedSize(availableSizes[0].value);
    }
  }, [availableSizes, selectedSize]);

  // Ensure currentImage always defaults to the first image or placeholder
  const currentImage =
    imageList[activeImage] ??
    imageList[0] ??
    allImages[0] ??
    product.images.main ??
    "/placeholder.png";
  
  const handleAddToCart = () => {
    // Prevent any action if the item is out of stock.
    if (isOutOfStock) {
      setSelectionError("Out of stock");
      return false;
    }

    if (!hasVariantAvailable) {
      setSelectionError("Selected options are sold out");
      return false;
    }

    if (!activeColor && requiresColorSelection) {
      setSelectionError("Please choose a color and size before adding to cart.");
      return false;
    }

    if (!selectedSize && requiresSizeSelection) {
      setSelectionError("Please choose a color and size before adding to cart.");
      return false;
    }

    const colorName = activeColor?.label ?? activeColor?.hex ?? "Standard";
    const colorCode = activeColor?.hex ?? "default";
    const size = selectedSize ?? "Taille unique";

    const variantKey = `${product.id}-${colorCode}-${size}`.toLowerCase();
    const existing = items.find((item) => item.variantKey === variantKey);
    const maxQty = existing?.maxQuantity ?? availableStock;
    if (typeof maxQty === "number" && maxQty > 0 && (existing?.quantity ?? 0) >= maxQty) {
      setSelectionError("Max stock reached");
      return false;
    }

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.nameFr,
      price: product.priceDzd,
      currency: product.currency,
      image: imageList[activeImage] ?? product.images.main,
      colorName,
      colorCode,
      size,
      maxQuantity: availableStock ?? undefined,
    });

    setSelectionError(null);
    if (flyToCart && !isOutOfStock) {
      flyToCart(imageRef.current);
    }
    return true;
  };

  // Only show gender if it's explicitly set (not empty string)
  const infoRows = product.gender && product.gender.trim() !== "" ? [{ label: "Genre", value: product.gender }] : [];

  const isSelectionMissing =
    (!activeColor && requiresColorSelection) || (!selectedSize && requiresSizeSelection);
  const stockMessage = isOutOfStock
    ? "Out of stock"
    : typeof availableStock === "number"
      ? `Available: ${availableStock} item${availableStock === 1 ? "" : "s"}`
      : null;
  const selectionMessage = isSelectionMissing
    ? "Please choose a color and size before adding to cart."
    : null;
  const displayMessage = isOutOfStock
    ? "Out of stock"
    : selectionError ?? (!hasVariantAvailable ? "Selected options are sold out" : selectionMessage);

  return (
    <main className="mx-auto max-w-6xl px-4 lg:px-8 py-6">
      <div className="grid gap-8 md:grid-cols-[96px_minmax(0,440px)_minmax(0,440px)] items-start">
        {imageList.length > 1 ? (
          <div className="hidden md:flex flex-col gap-4">
            {imageList.map((url, index) => {
              const isActive = index === activeImage;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative h-[96px] w-[96px] overflow-hidden rounded-2xl border border-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                    isActive ? "ring-2 ring-white/60" : "hover:border-white/40"
                  }`}
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
        ) : (
          <div className="hidden md:block" aria-hidden="true" />
        )}

        <div className="flex flex-col gap-4">
          <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-[36px] overflow-hidden border border-white/15 shadow-lg">
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

          {imageList.length > 1 && (
            <div className="md:hidden flex gap-3 overflow-x-auto pb-2">
              {imageList.map((url, index) => {
                const isActive = index === activeImage;
                return (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                      isActive ? "ring-2 ring-white/60" : "hover:border-white/40"
                    }`}
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
        </div>

        <div className="w-full max-w-[480px] flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/45 p-5 shadow-[0_10px_28px_rgba(0,0,0,0.32)]">
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
              {colorOptions.map((color, index) => {
                const hexValue = resolveSwatchHex(color);
                const label = color.label ?? color.hex ?? "Color";
                const isSoldOut = color.soldOut;
                return (
                  <Swatch
                    key={color.hex + index}
                    label={label}
                    colorHex={hexValue}
                    selected={color.hex === activeColor?.hex}
                    onSelect={() => {
                      if (isSoldOut) return;
                      setActiveColor(color);
                      setActiveImage(Math.min(index, Math.max(imageList.length - 1, 0)));
                      setSelectionError(null);
                    }}
                    size="sm"
                    showLabel={false}
                    disabled={isSoldOut}
                    isSoldOut={isSoldOut}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-white/80">Tailles</h2>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const isSelected = selectedSize === size.value;
                const isSoldOut = size.soldOut;
                const handleSelectSize = () => {
                  if (isSoldOut) return;
                  setSelectedSize(size.value);
                  setSelectionError(null);
                };
                return (
                  <motion.button
                    key={size.value}
                    type="button"
                    onClick={handleSelectSize}
                    aria-pressed={isSelected}
                    aria-disabled={isSoldOut}
                    disabled={isSoldOut}
                    className={`relative rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                      isSoldOut
                        ? "cursor-not-allowed border-dashed border-white/15 bg-white/5 text-white/70 opacity-60"
                        : isSelected
                          ? "border-white bg-white/15 text-white"
                          : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                    }`}
                    whileHover={isSoldOut ? undefined : { y: -1 }}
                    whileTap={isSoldOut ? undefined : { scale: 0.97 }}
                  >
                    <span className="relative inline-flex items-center justify-center">
                      {sizeLabel(size.value)}
                      {isSoldOut ? <SoldOutMark /> : null}
                    </span>
                    {isSoldOut ? (
                      <span className="ml-1 text-[10px] uppercase tracking-wide text-rose-100">Sold out</span>
                    ) : null}
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
              {displayMessage ?? "\u00a0"}
            </p>

            {!isOutOfStock && hasVariantAvailable && stockMessage && (
              <p className="min-h-[18px] text-xs font-semibold text-white" aria-live="polite">
                {stockMessage}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AnimatedAddToCartButton
                onClick={handleAddToCart}
                disabled={isOutOfStock || !hasVariantAvailable}
                className={`w-full justify-center sm:w-auto ${
                  isSelectionMissing || isOutOfStock || !hasVariantAvailable ? "opacity-60 cursor-not-allowed" : ""
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
