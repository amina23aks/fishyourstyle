import Image from "next/image";
import Link from "next/link";

import { getAllProducts } from "@/lib/products";
import { Product, ProductCategory } from "@/types/product";

const categoryLabels: Record<ProductCategory, string> = {
  hoodies: "Hoodie",
  pants: "Pantalon",
  tshirts: "Tshirt",
  sweatshirts: "Sweatshirt",
  ensembles: "Ensemble",
};

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

const getProductImages = (product: Product) => {
  const galleryImages = product.images.gallery ?? [];
  const colorImages = product.colors.map((color) => color.image).filter(Boolean);

  const uniqueImages = Array.from(
    new Set([product.images.main, ...galleryImages, ...colorImages]),
  );

  return {
    mainImage: uniqueImages[0],
    hoverImage: uniqueImages[1] ?? uniqueImages[0],
  };
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
            href={`/shop/${product.slug}`}
            key={product.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black shadow-xl shadow-black/30 transition-transform duration-200 hover:-translate-y-1"
          >
            {(() => {
              const { mainImage, hoverImage } = getProductImages(product);

              return (
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={mainImage}
                    alt={product.nameFr}
                    fill
                    priority={false}
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-opacity duration-300 group-hover:opacity-0"
                  />

                  <Image
                    src={hoverImage}
                    alt={product.nameFr}
                    fill
                    priority={false}
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

                  <div className="absolute inset-x-4 top-4 flex items-center justify-between text-xs font-semibold text-white">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] uppercase tracking-wide text-black shadow-sm shadow-black/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Back in stock
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] uppercase tracking-wide text-white/90 backdrop-blur">
                      {categoryLabels[product.category]}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="p-5 space-y-4">
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
                  <div className="flex items-center gap-2">
                    {product.colors.map((color) => (
                      <span
                        key={color.id}
                        className="h-7 w-7 rounded-full border border-white/40 bg-cover bg-center shadow-inner shadow-black/30"
                        style={{ backgroundImage: `url(${color.image})` }}
                        aria-label={color.labelFr}
                        title={color.labelFr}
                      />
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
