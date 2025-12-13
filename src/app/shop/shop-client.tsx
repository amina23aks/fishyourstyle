"use client";

import { useMemo, useState } from "react";
import { motion } from "@/lib/motion";
import { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import { CANONICAL_CATEGORIES, CANONICAL_DESIGNS, type SelectableItem } from "@/lib/categories-shared";

type ShopClientProps = {
  products: (Product & { designTheme?: string; tags?: string[]; discountPercent?: number; stock?: number; inStock?: boolean })[];
  errorMessage?: string | null;
  categories?: SelectableItem[];
  designThemes?: SelectableItem[];
};

function capitalizeLabel(value: string | undefined | null): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ShopClient({ products, errorMessage, categories, designThemes }: ShopClientProps) {
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [designFilter, setDesignFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const collectionValues = useMemo(() => {
    const source = categories && categories.length > 0 ? categories : CANONICAL_CATEGORIES;
    const allPill = { label: "All", value: "all" as const };
    const fetchedPills = source.map((item) => ({ label: item.label ?? capitalizeLabel(item.slug), value: item.slug }));
    return [allPill, ...fetchedPills];
  }, [categories]);

  const designValues = useMemo(() => {
    const source = designThemes && designThemes.length > 0 ? designThemes : CANONICAL_DESIGNS;
    const allPill = { label: "All", value: "all" as const };
    const fetchedPills = source.map((item) => ({ label: item.label ?? capitalizeLabel(item.slug), value: item.slug }));
    return [allPill, ...fetchedPills];
  }, [designThemes]);

  const collectionPills = useMemo(() => {
    return collectionValues;
  }, [collectionValues]);

  const allDesignPills = useMemo(() => {
    return designValues;
  }, [designValues]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const category = (product.category as string)?.toLowerCase();
      const design = (product.designTheme ?? "simple").toLowerCase();
      if (collectionFilter !== "all" && category !== collectionFilter) return false;
      if (designFilter !== "all" && design !== designFilter) return false;

      if (!term) return true;
      const tags = (product.tags ?? []) as string[];
      const haystack = `${product.nameFr} ${tags.join(" ")}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [collectionFilter, designFilter, products, search]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-400">Boutique</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Découvrezc notre sélection</h1>
            <p className="mt-3 text-sm text-neutral-400">Une grille élégante inspirée des vitrines minimalistes.</p>
          </div>
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
              placeholder="Rechercher par nom ou tag…"
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
    </>
  );
}

