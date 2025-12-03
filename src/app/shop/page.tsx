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

export default function ShopPage() {
  const products = getAllProducts();

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400 uppercase tracking-[0.2em]">
            Boutique
          </p>
          <h1 className="text-3xl font-semibold text-white mt-2">
            Découvrez notre sélection
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <Link
            href={`/product/${product.slug}`}
            key={product.id}
            className="group rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900 to-neutral-950 overflow-hidden shadow-lg shadow-black/20 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900">
              <Image
                src={product.images.main}
                alt={product.nameFr}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={false}
              />
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {categoryLabels[product.category]}
                </span>
                <span className="text-xs text-neutral-400">
                  {product.kind}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white line-clamp-2">
                  {product.nameFr}
                </h2>
                <p className="text-sm text-neutral-400">{product.fit}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xl font-semibold text-white">
                  {formatPrice(product.priceDzd)}
                </p>
                {product.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-200">
                    {product.colors.map((color) => (
                      <span
                        key={color.id}
                        className="rounded-full bg-white/10 px-3 py-1"
                      >
                        {color.labelFr}
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
