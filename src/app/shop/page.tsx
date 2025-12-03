import { getAllProducts } from "@/lib/products";
import { ProductCard } from "./product-card";

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
            Découvrezc tydvstdda notre sélection
          </h1>
          <p className="text-neutral-400 mt-3 text-sm">
            Une grille élégante inspirée des vitrines minimalistes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
