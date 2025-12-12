"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./shop/product-card";
import type { Product } from "@/types/product";
import { DEFAULT_COLLECTION_FILTERS, DEFAULT_DESIGN_FILTERS } from "@/lib/filter-config";
import type { SelectableItem } from "@/lib/categories-shared";

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
    const fetched = (categories ?? []).map((c) => ({
      slug: c.slug,
      label: c.label ?? capitalizeLabel(c.slug),
    }));
    const fetchedSlugs = fetched.map((item) => item.slug);
    const allowDynamicCollections = fetched.length === 0;
    const dynamic = allowDynamicCollections
      ? Array.from(
          new Set(
            (products ?? [])
              .map((p) => p.category)
              .filter(Boolean)
              .map((value) => (typeof value === "string" ? value : String(value))),
          ),
        )
      : [];
    const dynamicPills = dynamic
      .filter((val) => !DEFAULT_COLLECTION_FILTERS.some((d) => d.value === val) && !fetchedSlugs.includes(val))
      .map((val) => ({
        label: capitalizeLabel(val),
        value: val,
      }));
    const fetchedPills = fetched
      .filter((item) => !DEFAULT_COLLECTION_FILTERS.some((d) => d.value === item.slug))
      .map((item) => ({
        label: item.label,
        value: item.slug,
      }));
    const allPill = { label: "All", value: "all" as const };
    return [allPill, ...DEFAULT_COLLECTION_FILTERS, ...fetchedPills, ...dynamicPills];
  }, [products, categories]);

  const designPills = useMemo(() => {
    const fetched = (designThemes ?? []).map((c) => ({
      slug: c.slug,
      label: c.label ?? capitalizeLabel(c.slug),
    }));
    const fetchedSlugs = fetched.map((item) => item.slug);
    const allowDynamicDesigns = fetched.length === 0;
    const dynamic = allowDynamicDesigns
      ? Array.from(
          new Set(
            (products ?? [])
              .map((p) => p.designTheme)
              .filter(Boolean)
              .map((value) => (typeof value === "string" ? value : String(value))),
          ),
        )
      : [];
    const dynamicPills = dynamic
      .filter((val) => !DEFAULT_DESIGN_FILTERS.some((d) => d.value === val) && !fetchedSlugs.includes(val))
      .map((val) => ({
        label: capitalizeLabel(val),
        value: val,
      }));
    const fetchedPills = fetched
      .filter((item) => !DEFAULT_DESIGN_FILTERS.some((d) => d.value === item.slug))
      .map((item) => ({
        label: item.label,
        value: item.slug,
      }));
    const allPill = { label: "All", value: "all" as const };
    return [allPill, ...DEFAULT_DESIGN_FILTERS, ...fetchedPills, ...dynamicPills];
  }, [products, designThemes]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const category = (product.category as string)?.toLowerCase();
      const design = (product.designTheme ?? "basic").toLowerCase();
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
        <div className="mt-10 grid grid-cols-1 gap-8 md:gap-10 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

