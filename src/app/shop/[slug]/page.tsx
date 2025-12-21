import { notFound } from "next/navigation";

import { fetchStorefrontProductBySlug } from "@/lib/storefront-products";
import { mapStorefrontToProduct } from "@/lib/storefront-to-product";
import { ProductDetailContent } from "./product-detail-content";

export const dynamic = "force-dynamic";

type ProductDetailPageParams = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageParams) {
  const { slug } = await params;
  const storefrontProduct = await fetchStorefrontProductBySlug(slug);

  if (!storefrontProduct) {
    notFound();
  }

  const product = mapStorefrontToProduct(storefrontProduct);

  return <ProductDetailContent product={product} />;
}
