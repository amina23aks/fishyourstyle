"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "@/lib/motion";

import { Swatch } from "../swatch";
import { ProductCard } from "../product-card";
import { Product } from "@/types/product";
import { useCart } from "@/context/cart";
import { AnimatedAddToCartButton } from "@/components/AnimatedAddToCartButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFlyToCart } from "@/lib/useFlyToCart";
import { SoldOutTooltipWrapper } from "@/components/SoldOutTooltipWrapper";
import { trackViewItem } from "@/lib/analytics";
import { normalizeProductStock } from "@/lib/stock";
import {
  buildProductColorOptions,
  buildProductSizeOptions,
  hasAvailableVariants,
  resolveSwatchHex,
} from "@/lib/product-variants";
import { useFavorites } from "@/hooks/use-favorites";
import { viewContent } from "@/lib/metaPixel";
import { useTranslations } from "@/i18n/I18nProvider";
import { optimizeCloudinaryImageUrl } from "@/lib/cloudinary-image";

const formatPrice = (value: number, currency: Product["currency"]) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} ${currency}`;

const sizeLabel = (size: string) => size.toUpperCase();
const capitalizeLabel = (value: string | undefined | null): string => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export function ProductDetailContent({
  product,
  suggestedProducts = [],
}: {
  product: Product;
  suggestedProducts?: Product[];
}) {
  const t = useTranslations();
  const collectionName =
    product.designTheme && product.designTheme !== "simple"
      ? capitalizeLabel(product.designTheme)
      : capitalizeLabel(product.category);
  const { isFavorite, toggleFavorite, isUpdating } = useFavorites();
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
  const viewItemTrackedRef = useRef<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const stockState = normalizeProductStock({
    stockMode: product.stockMode,
    stockQty: product.stockQty,
    inStock: product.inStock,
  });
  const isOutOfStock = !stockState.isAvailable;
  const availableStock = stockState.stockMode === "limited" ? stockState.stockQty : undefined;
  const hasColorSelection = !requiresColorSelection || Boolean(activeColor);
  const hasSizeSelection = !requiresSizeSelection || Boolean(selectedSize);
  const sizeGuideImageUrl = product.sizeGuideImageUrl ?? null;
  const showSizeGuide = Boolean(product.sizeGuideEnabled && sizeGuideImageUrl);
  const optimizedSizeGuideImageUrl = optimizeCloudinaryImageUrl(sizeGuideImageUrl, "detail");

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

  useEffect(() => {
    if (!product.id) return;
    if (viewItemTrackedRef.current === product.id) return;

    viewItemTrackedRef.current = product.id;
    trackViewItem({
      currency: product.currency ?? "DZD",
      value: product.priceDzd,
      items: [
        {
          item_id: product.id,
          item_name: product.nameFr,
          price: product.priceDzd,
          quantity: 1,
        },
      ],
    });
    // Meta Pixel: ViewContent event for product detail view.
    viewContent({
      id: product.id,
      name: product.nameFr,
      price: product.priceDzd,
      currency: product.currency ?? "DZD",
    });
  }, [product.currency, product.id, product.nameFr, product.priceDzd]);

  useEffect(() => {
    if (!isSizeGuideOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSizeGuideOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSizeGuideOpen]);

  // Ensure currentImage always defaults to the first image or placeholder
  const currentImage =
    imageList[activeImage] ??
    imageList[0] ??
    allImages[0] ??
    product.images.main ??
    "/placeholder.png";
  const optimizedCurrentImage = optimizeCloudinaryImageUrl(currentImage, "detail");
  
  const handleAddToCart = () => {
    // Prevent any action if the item is out of stock.
    if (isOutOfStock) {
      setSelectionError(t("shop.outOfStock"));
      return false;
    }

    if (!hasVariantAvailable) {
      setSelectionError(t("shop.selectedOptionsSoldOut"));
      return false;
    }

    if (!activeColor && requiresColorSelection) {
      setSelectionError(t("shop.selectColorSizeHelper"));
      return false;
    }

    if (!selectedSize && requiresSizeSelection) {
      setSelectionError(t("shop.selectColorSizeHelper"));
      return false;
    }

    const colorName = activeColor?.label ?? activeColor?.hex ?? "Standard";
    const colorCode = activeColor?.hex ?? "default";
    const size = selectedSize ?? "Taille unique";

    const variantKey = `${product.id}-${colorCode}-${size}`.toLowerCase();
    const existing = items.find((item) => item.variantKey === variantKey);
    const maxQty = existing?.maxQuantity ?? availableStock;
    if (typeof maxQty === "number" && maxQty > 0 && (existing?.quantity ?? 0) >= maxQty) {
      setSelectionError(t("shop.outOfStock"));
      return false;
    }

    if (!stockState.isAvailable) {
      setSelectionError(t("shop.outOfStock"));
      return false;
    }

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.nameFr,
      category: product.category ?? "",
      design: product.designTheme ?? "",
      stockMode: stockState.stockMode,
      stockQty: stockState.stockQty,
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

  const isSelectionPartial = hasColorSelection !== hasSizeSelection;
  const availabilityLine =
    stockState.stockMode === "limited"
      ? isOutOfStock
        ? t("shop.outOfStock")
        : typeof availableStock === "number"
          ? t("shop.availableCount").replace("{count}", String(availableStock))
          : null
      : t("shop.inStock");
  const selectionMessage = isSelectionPartial
    ? t("shop.selectColorSizeHelper")
    : null;
  const displayMessage = isOutOfStock
    ? t("shop.outOfStock")
    : selectionError ?? (!hasVariantAvailable ? t("shop.selectedOptionsSoldOut") : selectionMessage);

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 lg:px-8">
      <div className="grid w-full min-w-0 gap-6 md:grid-cols-[96px_minmax(0,440px)_minmax(0,440px)] md:gap-8 items-start">
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
                    src={optimizeCloudinaryImageUrl(url, "thumbnail")}
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

        <div className="mx-auto flex w-full min-w-0 max-w-[480px] flex-col gap-3 md:mx-0 md:gap-4">
          <div className="relative aspect-[4/5] w-full max-w-full rounded-[36px] overflow-hidden border border-white/15 shadow-lg">
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
                  src={optimizedCurrentImage}
                  alt={product.nameFr}
                  fill
                  ref={imageRef}
                  className="object-cover"
                  sizes="(min-width: 1024px) 440px, (min-width: 768px) 50vw, 100vw"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {imageList.length > 1 && (
            <div className="gallery-thumbnails-scroll md:hidden flex w-full max-w-full min-w-0 gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] snap-x snap-mandatory touch-pan-x">
              {imageList.map((url, index) => {
                const isActive = index === activeImage;
                return (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative h-20 w-20 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                      isActive ? "ring-2 ring-white/60" : "hover:border-white/40"
                    }`}
                    aria-label={`Afficher l'image ${index + 1}`}
                  >
                    <Image
                      src={optimizeCloudinaryImageUrl(url, "thumbnail")}
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

        <div className="mx-auto flex w-full min-w-0 max-w-[480px] flex-col gap-4 rounded-2xl border border-white/10 bg-black/45 p-5 shadow-[0_10px_28px_rgba(0,0,0,0.32)] md:mx-0">
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

          <div className="space-y-1.5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-white/80">{t("shop.color")}</h2>
            <div className="color-chips-scroll flex w-full max-w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] md:flex-wrap md:overflow-visible md:pb-0">
              {colorOptions.map((color, index) => {
                const hexValue = resolveSwatchHex(color);
                const label = color.label ?? color.hex ?? t("shop.color");
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
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h2 className="min-w-0 text-[13px] font-semibold uppercase tracking-wide text-white/80">{t("shop.size")}</h2>
              {showSizeGuide ? (
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="ml-auto inline-flex shrink-0 cursor-pointer items-center justify-end gap-2 text-right text-base font-semibold text-white/70 underline underline-offset-4 transition hover:text-white/90 hover:opacity-90 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M3 12h18" />
                    <path d="M3 18h18" />
                    <path d="M7 6v2" />
                    <path d="M11 12v2" />
                    <path d="M15 6v2" />
                    <path d="M19 12v2" />
                  </svg>
                  {t("shop.sizeGuide")}
                </button>
              ) : null}
            </div>
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
                  <SoldOutTooltipWrapper key={size.value} isSoldOut={isSoldOut} className="inline-flex">
                    <motion.button
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
                        {isSoldOut ? (
                          <>
                            <span className="pointer-events-none absolute h-[2px] w-5 -rotate-45 bg-red-400/80 mix-blend-multiply" />
                            <span className="pointer-events-none absolute h-[2px] w-5 rotate-45 bg-red-400/80 mix-blend-multiply" />
                          </>
                        ) : null}
                      </span>
                      {isSoldOut ? (
                        <span className="ml-1 text-[10px] uppercase tracking-wide text-rose-100">{t("shop.outOfStock")}</span>
                      ) : null}
                    </motion.button>
                  </SoldOutTooltipWrapper>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 md:space-y-3">
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

            {availabilityLine && (
              <p className="min-h-[18px] text-xs font-semibold text-white" aria-live="polite">
                {availabilityLine}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <AnimatedAddToCartButton
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || !hasVariantAvailable}
                  className={`w-full justify-center sm:w-auto ${
                    isOutOfStock || !hasVariantAvailable ? "opacity-60 cursor-not-allowed" : ""
                  }`.trim()}
                />
                <FavoriteButton
                  isFavorite={isFavorite(product.id)}
                  disabled={isUpdating}
                  size="md"
                  onToggle={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void toggleFavorite({
                      id: product.id,
                      productId: product.id,
                      slug: product.slug,
                      name: product.nameFr,
                      image: currentImage,
                      price: product.priceDzd,
                      currency: product.currency,
                      inStock: !isOutOfStock,
                      addedAt: new Date().toISOString(),
                    });
                  }}
                />
              </div>
              <p className="text-[11px] text-neutral-400">Livraison rapide & échanges simples.</p>
            </div>
          </div>
        </div>
      </div>


      {suggestedProducts.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Suggested Products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {suggestedProducts.map((suggestedProduct) => (
              <ProductCard key={suggestedProduct.id} product={suggestedProduct} />
            ))}
          </div>
        </section>
      ) : null}

      {isSizeGuideOpen && showSizeGuide ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsSizeGuideOpen(false)}
            aria-label={t("common.close")}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-[32px] border border-white/10 bg-black/90 p-4 text-white shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-300">{t("shop.sizeGuide")}</p>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                {t("common.close")}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-[78vh] w-full">
                <Image
                  src={optimizedSizeGuideImageUrl}
                  alt={t("shop.sizeGuide")}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
