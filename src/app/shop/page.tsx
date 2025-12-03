import { motion } from "framer-motion";

import { getAllProducts } from "@/lib/products";
import { ProductCard } from "./product-card";

export default function ShopPage() {
  const products = getAllProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 overscroll-y-contain">
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

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.08 },
          },
        }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {products.map((product) => (
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
    </main>
  );
}
