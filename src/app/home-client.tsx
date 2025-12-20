"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./shop/product-card";
import type { Product } from "@/types/product";
import { CANONICAL_CATEGORIES, CANONICAL_DESIGNS, type SelectableItem } from "@/lib/categories-shared";

type Props = {
  products: (Product & { designTheme?: string; tags?: string[]; discountPercent?: number; stock?: number; inStock?: boolean })[];
  categories?: SelectableItem[];
  designThemes?: SelectableItem[];
};

function capitalizeLabel(value: string | undefined | null): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function HomeClient({ products, categories, designThemes }: Props) {
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [designFilter, setDesignFilter] = useState<string>("all");

  const collectionPills = useMemo(() => {
    const source = categories && categories.length > 0 ? categories : CANONICAL_CATEGORIES;
    const fetchedPills = source.map((item) => ({
      label: item.label ?? capitalizeLabel(item.slug),
      value: item.slug,
    }));
    const allPill = { label: "All", value: "all" as const };
    return [allPill, ...fetchedPills];
  }, [categories]);

  const designPills = useMemo(() => {
    const source = designThemes && designThemes.length > 0 ? designThemes : CANONICAL_DESIGNS;
    const fetchedPills = source.map((item) => ({
      label: item.label ?? capitalizeLabel(item.slug),
      value: item.slug,
    }));
    const allPill = { label: "All", value: "all" as const };
    return [allPill, ...fetchedPills];
  }, [designThemes]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const category = (product.category as string)?.toLowerCase();
      const design = (product.designTheme ?? "simple").toLowerCase();
      if (collectionFilter !== "all" && category !== collectionFilter) return false;
      if (designFilter !== "all" && design !== designFilter) return false;
      return true;
    });
  }, [collectionFilter, designFilter, products]);

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
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/80">
          No products in this category yet.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-8 md:gap-10 auto-rows-fr">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
