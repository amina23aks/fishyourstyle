import type { Metadata } from "next";

import { fetchAllStorefrontProducts } from "@/lib/storefront-products";
import { mapStorefrontToProduct } from "@/lib/storefront-to-product";
import type { Product } from "@/types/product";
import { WishlistClient } from "./WishlistClient";

export const metadata: Metadata = {
  title: "Wishlist | Fish Your Style",
  description: "View and manage the products you’ve saved for later.",
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const storefrontProducts = await fetchAllStorefrontProducts();
  const products: Product[] = storefrontProducts.map(mapStorefrontToProduct);

  return <WishlistClient products={products} />;
}
