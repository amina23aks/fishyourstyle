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
import {
  filterPublicCollectionPills,
  filterPublicDesignPills,
  getPublicShopCategoryVisibility,
  isPublicComingSoonCollection,
  type PublicShopFilterSettings,
} from "@/lib/filter-config";

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
  shopFilterSettings: PublicShopFilterSettings;
};

export default function ShopClient({
  products,
  filterProducts,
  initialCursor = null,
  errorMessage,
  categories,
  designThemes,
  shopFilterSettings,
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
  const isLoadingMoreRef = useRef(false);
  const failedCursorRef = useRef<string | null>(null);

  useEffect(() => {
    setLoadedProducts(products);
    setNextCursor(initialCursor);
  }, [initialCursor, products]);

  const loadMoreProducts = useCallback(async () => {
    if (
      !nextCursor ||
      isLoadingMoreRef.current ||
      failedCursorRef.current === nextCursor.id
    )
      return;

    const cursorId = nextCursor.id;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const params = new URLSearchParams({
        pageSize: "8",
        cursor: cursorId,
      });
      if (collectionFilter !== "all") params.set("category", collectionFilter);
      if (designFilter !== "all") params.set("designTheme", designFilter);
      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        failedCursorRef.current = cursorId;
        setNextCursor(null);
        throw new Error("Failed to load more products");
      }
      const payload = (await response.json()) as ShopProductsResponse;
      failedCursorRef.current = null;
      setLoadedProducts((prev) => [...prev, ...(payload.products ?? [])]);
      setNextCursor(payload.nextCursor ?? null);
    } catch (error) {
      setLoadMoreError(
        error instanceof Error ? error.message : "Failed to load more products",
      );
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [collectionFilter, designFilter, nextCursor]);

  const { categoryPills: collectionPills, designPills: allDesignPills } =
    useMemo(() => {
      const pills = buildDependentFilterPills({
        products: filterProducts ?? products,
        categories,
        designThemes,
        selectedCategory: collectionFilter,
      });

      return {
        categoryPills: filterPublicCollectionPills(
          pills.categoryPills,
          shopFilterSettings,
        ),
        designPills: filterPublicDesignPills(
          pills.designPills,
          shopFilterSettings,
        ),
      };
    }, [
      categories,
      collectionFilter,
      designThemes,
      filterProducts,
      products,
      shopFilterSettings,
    ]);

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
        failedCursorRef.current = null;
        setLoadedProducts(products);
        setNextCursor(initialCursor);
        return;
      }
      failedCursorRef.current = null;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setLoadMoreError(null);
      try {
        const params = new URLSearchParams({ pageSize: "8" });
        if (collectionFilter !== "all")
          params.set("category", collectionFilter);
        if (designFilter !== "all") params.set("designTheme", designFilter);
        const response = await fetch(`/api/products?${params.toString()}`, {
          credentials: "same-origin",
        });
        if (!response.ok) {
          if (!ignore) setNextCursor(null);
          throw new Error("Failed to load filtered products");
        }
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
        isLoadingMoreRef.current = false;
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

  const selectedCollectionLabel =
    collectionPills.find((pill) => pill.value === collectionFilter)?.label ??
    collectionFilter;
  const showComingSoonEmptyState =
    collectionFilter !== "all" &&
    designFilter === "all" &&
    !search.trim() &&
    filteredProducts.length === 0 &&
    isPublicComingSoonCollection(collectionFilter, shopFilterSettings);
  const showDesignFilters = allDesignPills.length > 1;

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
                  const visibility = getPublicShopCategoryVisibility(pill.value, shopFilterSettings);
                  const isComingSoon = visibility?.isComingSoon === true;
                  return (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => handleCollectionFilterChange(pill.value)}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active && isComingSoon
                          ? "border-amber-100/70 bg-amber-100/90 text-slate-950 shadow-sm shadow-amber-950/20"
                          : active
                            ? "border-white bg-white text-slate-900"
                            : isComingSoon
                              ? "border-amber-100/30 bg-white/5 text-white/75 hover:border-amber-100/45 hover:bg-amber-100/10"
                              : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                      }`}
                    >
                      <span>{pill.label}</span>
                      {isComingSoon ? (
                        <span className={`ml-2 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
                            active
                              ? "border-slate-950/15 bg-slate-950/10 text-slate-950/80"
                              : "border-amber-100/25 bg-amber-100/10 text-amber-50/75"
                          }`}>
                          soon
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {showDesignFilters ? (
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
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
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
            ) : null}
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
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-cyan-50/15 bg-white/[0.04] p-5 text-center text-white/80">
          {showComingSoonEmptyState ? (
            <div className="w-full max-w-md rounded-[1.75rem] border border-cyan-50/15 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(214,188,133,0.16),transparent_34%),linear-gradient(135deg,rgba(14,76,111,0.78),rgba(28,72,99,0.82))] px-6 py-8 shadow-[0_20px_50px_rgba(8,47,73,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-50/75">
                Next drop
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {selectedCollectionLabel} — Coming Soon
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-sky-50/78">
                We’re preparing this category for an upcoming drop.
              </p>
            </div>
          ) : (
            <p className="text-sm">No products in this category yet.</p>
          )}
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
