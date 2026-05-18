"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import type { SelectableItem } from "@/lib/categories-shared";
import {
  buildDependentFilterPills,
  isDesignFilterAvailableForCategory,
} from "@/lib/dependent-filter-options";
import { useTranslations } from "@/i18n/I18nProvider";

type StorefrontCursor = {
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
  filterProducts?: Pick<
    ShopClientProduct,
    "category" | "designTheme" | "status"
  >[];
  initialCursor?: StorefrontCursor | null;
  errorMessage?: string | null;
  categories?: SelectableItem[];
  designThemes?: SelectableItem[];
};

export default function ShopClient({
  products,
  filterProducts,
  initialCursor = null,
  errorMessage,
  categories,
  designThemes,
}: ShopClientProps) {
  const t = useTranslations();
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [designFilter, setDesignFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loadedProducts, setLoadedProducts] =
    useState<ShopClientProduct[]>(products);
  const [nextCursor, setNextCursor] = useState<StorefrontCursor | null>(
    initialCursor,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);

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
        pageSize: "8",
        cursor: JSON.stringify(nextCursor),
      });
      if (collectionFilter !== "all") params.set("category", collectionFilter);
      if (designFilter !== "all") params.set("designTheme", designFilter);
      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: "omit",
      });
      if (!response.ok) throw new Error("Failed to load more products");
      const payload = (await response.json()) as ShopProductsResponse;
      setLoadedProducts((prev) => [...prev, ...(payload.products ?? [])]);
      setNextCursor(payload.nextCursor ?? null);
    } catch (error) {
      setLoadMoreError(
        error instanceof Error ? error.message : "Failed to load more products",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [collectionFilter, designFilter, isLoadingMore, nextCursor]);

  const { categoryPills: collectionPills, designPills: allDesignPills } =
    useMemo(
      () =>
        buildDependentFilterPills({
          products: filterProducts ?? products,
          categories,
          designThemes,
          selectedCategory: collectionFilter,
        }),
      [categories, collectionFilter, designThemes, filterProducts, products],
    );

  const handleCollectionFilterChange = useCallback(
    (nextCollection: string) => {
      startTransition(() => {
        setCollectionFilter(nextCollection);
        setDesignFilter((currentDesign) =>
          isDesignFilterAvailableForCategory({
            products: filterProducts ?? products,
            selectedCategory: nextCollection,
            selectedDesign: currentDesign,
          })
            ? currentDesign
            : "all",
        );
      });
    },
    [filterProducts, products],
  );

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
        const params = new URLSearchParams({ pageSize: "8" });
        if (collectionFilter !== "all")
          params.set("category", collectionFilter);
        if (designFilter !== "all") params.set("designTheme", designFilter);
        const response = await fetch(`/api/products?${params.toString()}`, {
          credentials: "omit",
        });
        if (!response.ok) throw new Error("Failed to load filtered products");
        const payload = (await response.json()) as ShopProductsResponse;
        if (!ignore) {
          setLoadedProducts(payload.products ?? []);
          setNextCursor(payload.nextCursor ?? null);
        }
      } catch (error) {
        if (!ignore)
          setLoadMoreError(
            error instanceof Error
              ? error.message
              : "Failed to load filtered products",
          );
      } finally {
        if (!ignore) setIsLoadingMore(false);
      }
    }
    void loadFilteredProducts();
    return () => {
      ignore = true;
    };
  }, [collectionFilter, designFilter, initialCursor, products]);

  useEffect(() => {
    const sentinel = infiniteScrollRef.current;
    if (!sentinel || !nextCursor || isLoadingMore || errorMessage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreProducts();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [errorMessage, isLoadingMore, loadMoreProducts, nextCursor]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return loadedProducts.filter((product) => {
      const category = (product.category as string)?.toLowerCase();
      const design = (product.designTheme ?? "simple").toLowerCase();
      if (
        collectionFilter !== "all" &&
        category !== collectionFilter.toLowerCase()
      )
        return false;
      if (designFilter !== "all" && design !== designFilter.toLowerCase())
        return false;

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
          <p className="text-sm uppercase tracking-[0.25em] text-white/90">
            {t("shop.headerEyebrow")}
          </p>
          <h1 className="text-4xl font-semibold text-white">
            {t("shop.headerTitle")}
          </h1>
          <p className="text-sm text-white/80">
            {t("shop.headerDescriptionLine1")}
            <br />
            {t("shop.headerDescriptionLine2")}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/40">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-100">
                Collections
              </p>
              <div className="flex flex-wrap gap-2">
                {collectionPills.map((pill) => {
                  const active = collectionFilter === pill.value;
                  return (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => handleCollectionFilterChange(pill.value)}
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
              <p className="text-xs uppercase tracking-[0.25em] text-slate-100">
                Design
              </p>
              <div className="flex flex-wrap gap-2">
                {allDesignPills.map((pill) => {
                  const active = designFilter === pill.value;
                  return (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() =>
                        startTransition(() => setDesignFilter(pill.value))
                      }
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
            <label className="text-xs uppercase tracking-[0.25em] text-slate-100">
              Search
            </label>
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
        <div className="mt-10 grid min-h-[350px] grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {loadMoreError ? (
        <p className="mt-4 text-center text-sm text-rose-100">
          {loadMoreError}
        </p>
      ) : null}

      {!errorMessage ? (
        <div ref={infiniteScrollRef} className="h-8" aria-hidden="true" />
      ) : null}

      {isLoadingMore ? (
        <p className="mt-4 text-center text-sm text-white/70">
          Loading more products...
        </p>
      ) : null}
    </>
  );
}
