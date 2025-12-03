import Image from "next/image";
import Link from "next/link";

import { getAllProducts } from "@/lib/products";
import { ProductCategory } from "@/types/product";

const categoryLabels: Record<ProductCategory, string> = {
  hoodies: "Hoodie",
  pants: "Pantalon",
  tshirts: "Tshirt",
  sweatshirts: "Sweatshirt",
  ensembles: "Ensemble",
};

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

const colorSwatches: Record<string, string> = {
  black: "#0b0b0b",
  white: "#f6f6f6",
  grey: "#9ca3af",
  blue: "#4f73c8",
  beige: "#e5d5bc",
  navy: "#1f2a44",
  green: "#4c8a4c",
};

export default function ShopPage() {
  const products = getAllProducts();

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400 uppercase tracking-[0.25em]">
            Boutique
          </p>
          <h1 className="text-4xl font-semibold text-white mt-2">
            Découvrez notre sélection
          </h1>
          <p className="text-neutral-400 mt-3 text-sm">
            Une grille élégante inspirée des vitrines minimalistes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <Link
            href={`/product/${product.slug}`}
            key={product.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black shadow-xl shadow-black/30 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src={product.images.main}
                alt={product.nameFr}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={false}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

              <div className="absolute inset-x-4 top-4 flex items-center justify-between text-xs font-semibold text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] uppercase tracking-wide text-black shadow-sm shadow-black/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Back in stock
                </span>
                <span className="rounded-full bg-black/30 px-2.5 py-1 text-white/80 backdrop-blur">
                  ★
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-4 text-white/90">
                <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-wide">
                  {categoryLabels[product.category]}
                </span>
                <span className="text-xs text-white/70">{product.kind}</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white line-clamp-2">
                  {product.nameFr}
                </h2>
                <p className="text-sm text-neutral-400">{product.fit}</p>
              </div>

              <div className="flex items-center justify-between gap-6">
                <p className="text-xl font-semibold text-white">
                  {formatPrice(product.priceDzd)}
                </p>
                {product.colors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-200">
                    {product.colors.map((color) => (
                      <span key={color.id} className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-white/20 shadow-inner shadow-black/30"
                          style={{
                            backgroundColor: colorSwatches[color.id] ?? "#9ca3af",
                          }}
                          aria-hidden
                        />
                        <span className="text-[11px] text-neutral-200">
                          {color.labelFr}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
