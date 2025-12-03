import productsData from "@/data/products.json";

import { Product, ProductCategory } from "@/types/product";

export const products: Product[] = productsData as Product[];

export const getAllProducts = (): Product[] =>
  products.filter((product) => product.status === "active");

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((product) => product.slug === slug);

export const getProductsByCategory = (
  category: ProductCategory,
): Product[] => products.filter((product) => product.category === category);
