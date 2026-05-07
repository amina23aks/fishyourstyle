"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "./shop/product-card";
import type { Product } from "@/types/product";
import { CANONICAL_CATEGORIES, CANONICAL_DESIGNS, type SelectableItem } from "@/lib/categories-shared";

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
};

function capitalizeLabel(value: string | undefined | null): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function HomeClient({ products, allProducts, categories, designThemes }: Props) {
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [designFilter, setDesignFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterSourceProducts = allProducts ?? products;

  const collectionPills = useMemo(() => {
    const source = categories && categories.length > 0 ? categories : CANONICAL_CATEGORIES;
    const fetchedPills = source.map((item) => ({
      label: item.label ?? capitalizeLabel(item.slug),
      value: item.slug.toLowerCase(),
    }));
    const allPill = { label: "All", value: "all" as const };
    return [allPill, ...fetchedPills];
  }, [categories]);

  const designPills = useMemo(() => {
    const allPill = { label: "All", value: "all" as const };
    const designMap = new Map<string, string>();
    filterSourceProducts.forEach((product) => {
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
  }, [filterSourceProducts, designThemes]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const hasActiveFilter = collectionFilter !== "all" || designFilter !== "all" || Boolean(term);
    const sourceProducts = hasActiveFilter ? filterSourceProducts : products;

    return sourceProducts.filter((product) => {
      const category = (product.category as string)?.toLowerCase();
      const design = (product.designTheme ?? "simple").toLowerCase();
      if (collectionFilter !== "all" && category !== collectionFilter.toLowerCase()) return false;
      if (designFilter !== "all" && design !== designFilter.toLowerCase()) return false;
      if (!term) return true;
      const tags = (product.tags ?? []) as string[];
      const haystack = `${product.nameFr} ${tags.join(" ")}`.toLowerCase();
      return haystack.includes(term);
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
