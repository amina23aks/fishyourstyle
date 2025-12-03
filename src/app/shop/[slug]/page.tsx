import { notFound } from "next/navigation";

import { getAllProducts, getProductBySlug } from "@/lib/products";
import { ProductDetailContent } from "./product-detail-content";

export async function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailContent product={product} />;
}
