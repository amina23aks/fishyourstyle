"use client";

import { useMemo, useState } from "react";
import { motion } from "@/lib/motion";
import { Product } from "@/types/product";
import { ProductCard } from "./product-card";

const collectionPills = [
  { label: "All", value: "all" },
  { label: "Hoodies", value: "hoodies" },
  { label: "Pants", value: "pants" },
  { label: "Ensembles", value: "ensembles" },
  { label: "Tshirts", value: "tshirts" },
] as const;

const designPills = [
  { label: "All", value: "all" },
  { label: "Cars", value: "cars" },
  { label: "Nature", value: "nature" },
  { label: "Anime", value: "anime" },
  { label: "Harry Potter", value: "harry-potter" },
  { label: "Basic", value: "basic" },
] as const;

type Props = { products: (Product & { designTheme?: string; tags?: string[]; discountPercent?: number })[] };

export default function ShopClient({ products }: Props) {
  const [collectionFilter, setCollectionFilter] = useState<(typeof collectionPills)[number]["value"]>("all");
  const [designFilter, setDesignFilter] = useState<(typeof designPills)[number]["value"]>("all");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const category = (product.category as string)?.toLowerCase();
      const design = (product.designTheme ?? "basic").toLowerCase();
      if (collectionFilter !== "all" && category !== collectionFilter) return false;
      if (designFilter !== "all" && design !== designFilter) return false;

      if (!term) return true;
      const tags = (product.tags ?? []) as string[];
      const haystack = `${product.nameFr ?? product.name ?? ""} ${tags.join(" ")}`.toLowerCase();
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
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-300">Collections</p>
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
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-300">Design</p>
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
            <label className="text-xs uppercase tracking-[0.25em] text-neutral-300">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou tag…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.08 },
          },
        }}
        className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
    </>
  );
}

