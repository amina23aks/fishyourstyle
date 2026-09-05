"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "./shop/product-card";
import type { Product } from "@/types/product";
import type { SelectableItem } from "@/lib/categories-shared";
import { buildDependentFilterPills, isDesignFilterAvailableForCategory } from "@/lib/dependent-filter-options";
import {
  filterPublicCollectionPills,
  filterPublicDesignPills,
  type PublicShopFilterSettings,
} from "@/lib/filter-config";
import { filterHomepageProducts } from "@/lib/homepage-product-filter";

type Props = {
  products: (Product & {
    designTheme?: string;
    tags?: string[];
    discountPercent?: number;
    stockMode?: "unlimited" | "limited";
    stockQty?: number;
    inStock?: boolean;
  })[];
  allProducts?: (Product & {
    designTheme?: string;
    tags?: string[];
    discountPercent?: number;
    stockMode?: "unlimited" | "limited";
    stockQty?: number;
    inStock?: boolean;
  })[];
  categories?: SelectableItem[];
  designThemes?: SelectableItem[];
  shopFilterSettings?: PublicShopFilterSettings;
};

export default function HomeClient({ products, allProducts, categories, designThemes, shopFilterSettings }: Props) {
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [designFilter, setDesignFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterSourceProducts = allProducts ?? products;

  const { collectionPills, designPills } = useMemo(() => {
      const built = buildDependentFilterPills({
        products: filterSourceProducts,
        categories,
        designThemes,
        selectedCategory: collectionFilter,
      });
      return {
        collectionPills: filterPublicCollectionPills(built.categoryPills, shopFilterSettings),
        designPills: filterPublicDesignPills(built.designPills, shopFilterSettings),
      };
    }, [categories, collectionFilter, designThemes, filterSourceProducts, shopFilterSettings]);

  const handleCollectionFilterChange = useCallback(
    (nextCollection: string) => {
      setCollectionFilter(nextCollection);
      setDesignFilter((currentDesign) =>
        isDesignFilterAvailableForCategory({
          products: filterSourceProducts,
          selectedCategory: nextCollection,
          selectedDesign: currentDesign,
        })
          ? currentDesign
          : "all",
      );
    },
    [filterSourceProducts],
  );

  const filteredProducts = useMemo(() => {
    return filterHomepageProducts(products, filterSourceProducts, {
      category: collectionFilter,
      design: designFilter,
      search,
    });
  }, [collectionFilter, designFilter, filterSourceProducts, products, search]);

  useEffect(() => {
    const focusSearch = () => {
      if (window.location.hash === "#shop-search-input") {
        searchInputRef.current?.focus();
      }
    };
    focusSearch();
    window.addEventListener("hashchange", focusSearch);
    return () => window.removeEventListener("hashchange", focusSearch);
  }, []);

  return (
    <>
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
            <p className="text-xs uppercase tracking-[0.25em] text-slate-100">Design</p>
            <div className="flex flex-wrap gap-2">
              {designPills.map((pill) => {
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
            id="shop-search-input"
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or tag..."
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 placeholder:text-slate-300 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/80">
          No products in this category yet.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4 md:gap-10 auto-rows-fr">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
