"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion";
import { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import { CANONICAL_CATEGORIES, CANONICAL_DESIGNS, type SelectableItem } from "@/lib/categories-shared";
import { useTranslations } from "@/i18n/I18nProvider";

type StorefrontCursor = {
  createdAtMillis: number;
  id: string;
};

type ShopClientProduct = Product & {
  designTheme?: string;
  tags?: string[];
  discountPercent?: number;
  stockMode?: "unlimited" | "limited";
  stockQty?: number;
  inStock?: boolean;
};

type ShopProductsResponse = {
  products?: ShopClientProduct[];
  nextCursor?: StorefrontCursor | null;
};

type ShopClientProps = {
  products: ShopClientProduct[];
  initialCursor?: StorefrontCursor | null;
  errorMessage?: string | null;
  categories?: SelectableItem[];
  designThemes?: SelectableItem[];
};

function capitalizeLabel(value: string | undefined | null): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ShopClient({ products, initialCursor = null, errorMessage, categories, designThemes }: ShopClientProps) {
  const t = useTranslations();
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [designFilter, setDesignFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loadedProducts, setLoadedProducts] = useState<ShopClientProduct[]>(products);
  const [nextCursor, setNextCursor] = useState<StorefrontCursor | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    setLoadedProducts(products);
    setNextCursor(initialCursor);
  }, [initialCursor, products]);

  const loadMoreProducts = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const params = new URLSearchParams({
        pageSize: "24",
        cursor: JSON.stringify(nextCursor),
      });
      if (collectionFilter !== "all") params.set("category", collectionFilter);
      if (designFilter !== "all") params.set("designTheme", designFilter);
      const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load more products");
      const payload = (await response.json()) as ShopProductsResponse;
      setLoadedProducts((prev) => [...prev, ...(payload.products ?? [])]);
      setNextCursor(payload.nextCursor ?? null);
    } catch (error) {
      setLoadMoreError(error instanceof Error ? error.message : "Failed to load more products");
    } finally {
      setIsLoadingMore(false);
    }
  }, [collectionFilter, designFilter, isLoadingMore, nextCursor]);

  const collectionValues = useMemo(() => {
    const source = categories && categories.length > 0 ? categories : CANONICAL_CATEGORIES;
    const allPill = { label: "All", value: "all" as const };
    const fetchedPills = source.map((item) => ({ label: item.label ?? capitalizeLabel(item.slug), value: item.slug }));
    return [allPill, ...fetchedPills];
  }, [categories]);

  const designValues = useMemo(() => {
    const allPill = { label: "All", value: "all" as const };
    const designMap = new Map<string, string>();
    loadedProducts.forEach((product) => {
      const rawTheme = typeof product.designTheme === "string" ? product.designTheme.trim() : "";
      if (!rawTheme) return;
      const normalized = rawTheme.toLowerCase();
      if (!designMap.has(normalized)) {
        designMap.set(normalized, capitalizeLabel(rawTheme));
      }
    });

    const baseDesigns = Array.from(designMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const hasSimple = baseDesigns.some((item) => item.value === "simple");
    const simpleInDesigns = designThemes?.some((item) => {
      const slug = typeof item.slug === "string" ? item.slug.toLowerCase() : "";
      const label = typeof item.label === "string" ? item.label.toLowerCase() : "";
      return slug === "simple" || label === "simple";
    });

    if (!hasSimple && simpleInDesigns) {
      baseDesigns.unshift({ label: "Simple", value: "simple" });
    }

    if (baseDesigns.length === 0) {
      const fallback = (designThemes && designThemes.length > 0 ? designThemes : CANONICAL_DESIGNS).map((item) => ({
        label: item.label ?? capitalizeLabel(item.slug),
        value: item.slug.toLowerCase(),
      }));
      return [allPill, ...fallback];
    }

    return [allPill, ...baseDesigns];
  }, [designThemes, loadedProducts]);

  const collectionPills = useMemo(() => {
    return collectionValues;
  }, [collectionValues]);

  const allDesignPills = useMemo(() => {
    return designValues;
  }, [designValues]);

  useEffect(() => {
    let ignore = false;
    async function loadFilteredProducts() {
      if (collectionFilter === "all" && designFilter === "all") {
        setLoadedProducts(products);
        setNextCursor(initialCursor);
        return;
      }
      setIsLoadingMore(true);
      setLoadMoreError(null);
      try {
        const params = new URLSearchParams({ pageSize: "24" });
        if (collectionFilter !== "all") params.set("category", collectionFilter);
        if (designFilter !== "all") params.set("designTheme", designFilter);
        const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load filtered products");
        const payload = (await response.json()) as ShopProductsResponse;
        if (!ignore) {
          setLoadedProducts(payload.products ?? []);
          setNextCursor(payload.nextCursor ?? null);
        }
      } catch (error) {
        if (!ignore) setLoadMoreError(error instanceof Error ? error.message : "Failed to load filtered products");
      } finally {
        if (!ignore) setIsLoadingMore(false);
      }
    }
    void loadFilteredProducts();
    return () => {
      ignore = true;
    };
  }, [collectionFilter, designFilter, initialCursor, products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return loadedProducts.filter((product) => {
      const category = (product.category as string)?.toLowerCase();
      const design = (product.designTheme ?? "simple").toLowerCase();
      if (collectionFilter !== "all" && category !== collectionFilter) return false;
      if (designFilter !== "all" && design !== designFilter) return false;

      if (!term) return true;
      const tags = (product.tags ?? []) as string[];
      const haystack = `${product.nameFr} ${tags.join(" ")}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [collectionFilter, designFilter, loadedProducts, search]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-white/90">{t("shop.headerEyebrow")}</p>
          <h1 className="text-4xl font-semibold text-white">{t("shop.headerTitle")}</h1>
          <p className="text-sm text-white/80">
            {t("shop.headerDescriptionLine1")}
            <br />
            {t("shop.headerDescriptionLine2")}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/40">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-100">Collections</p>
              <div className="flex flex-wrap gap-2">
                {collectionPills.map((pill) => {
                  const active = collectionFilter === pill.value;
                  return (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => setCollectionFilter(pill.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-white bg-white text-slate-900"
                          : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-100">Design</p>
              <div className="flex flex-wrap gap-2">
                {allDesignPills.map((pill) => {
                  const active = designFilter === pill.value;
                  return (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => setDesignFilter(pill.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-white bg-white text-slate-900"
                          : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.25em] text-slate-100">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or tag..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 placeholder:text-slate-300 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          {errorMessage}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/80 min-h-[350px] flex items-center justify-center">
          No products in this category yet.
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="mt-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 min-h-[350px]"
        >
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, scale: 0.97, y: 12 },
                visible: { opacity: 1, scale: 1, y: 0 },
              }}
              transition={{ duration: 0.35, easing: "ease" }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {loadMoreError ? (
        <p className="mt-4 text-center text-sm text-rose-100">{loadMoreError}</p>
      ) : null}

      {!errorMessage && nextCursor ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMoreProducts}
            disabled={isLoadingMore}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
