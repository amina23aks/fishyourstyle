import { notFound } from "next/navigation";

import { getAllProducts, getProductBySlug } from "@/lib/products";
import { ProductDetailContent } from "./product-detail-content";

export async function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

type ProductDetailPageParams = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageParams) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailContent product={product} />;
}
