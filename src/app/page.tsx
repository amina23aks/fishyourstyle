import Link from "next/link";
import Hero from "@/components/Hero";
import { fetchAllStorefrontProducts, type StorefrontProduct } from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import HomeClient from "./home-client";
import {
  DEFAULT_CATEGORY_OPTIONS,
  DEFAULT_DESIGN_OPTIONS,
  getSelectableCategories,
  getSelectableDesigns,
} from "@/lib/categories";

export const revalidate = 3600;

function mapStorefrontToProduct(sp: StorefrontProduct): Product {
  const mainImage = sp.images?.[0] ?? "/placeholder.png";
  const gallery = sp.images?.slice(1) ?? [];
  return {
    id: sp.id,
    slug: sp.slug,
    nameFr: sp.name,
    nameAr: sp.name,
    category: sp.category,
    kind: sp.category,
    fit: "regular",
    priceDzd: sp.finalPrice ?? sp.basePrice,
    currency: "DZD",
    gender: sp.gender ?? "",
    sizes: sp.sizes ?? [],
    colors: (sp.colors ?? []).map((hex) => ({
      id: hex,
      labelFr: hex,
      labelAr: hex,
      image: mainImage,
    })),
    images: { main: mainImage, gallery },
    descriptionFr: sp.description ?? "",
    descriptionAr: sp.description ?? "",
    status: "active",
    designTheme: sp.designTheme,
    tags: sp.tags ?? [],
    discountPercent: sp.discountPercent ?? 0,
    stock: sp.stock ?? 0,
    inStock: sp.inStock ?? false,
  } as Product & { designTheme?: string; tags?: string[]; discountPercent?: number; stock?: number; inStock?: boolean };
}

const reasons = [
  {
    title: "Livraison sur 58 wilayas",
    description: "موّفرين التوصيل لكل الولايات مع تتبع الطلب خطوة بخطوة.",
  },
  {
    title: "Coupe & confort maîtrisés",
    description: "قصّات متوازنة، خامات ناعمة، وتفاصيل تعطيك الراحة والأناقة.",
  },
  {
    title: "Qualité qui dure",
    description: "أقمشة مختارة ولمسات بحرية في كل تصميم تبقى معك وقت طويل.",
  },
];

export default async function Home() {
  let errorMessage: string | null = null;
  let categories: Awaited<ReturnType<typeof getSelectableCategories>> = [];
  let designThemes: Awaited<ReturnType<typeof getSelectableDesigns>> = [];
  const storefrontProducts = await fetchAllStorefrontProducts().catch((error) => {
    console.error("Failed to fetch products:", error);
    errorMessage = "Products are temporarily unavailable.";
    return [];
  });
  try {
    categories = await getSelectableCategories();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    categories = DEFAULT_CATEGORY_OPTIONS;
  }
  try {
    designThemes = await getSelectableDesigns();
  } catch (error) {
    console.error("Failed to fetch design themes:", error);
    designThemes = DEFAULT_DESIGN_OPTIONS;
  }
  const allProducts = storefrontProducts.map(mapStorefrontToProduct);
  const products = allProducts.slice(0, 8);

  return (
    <div className="flex w-full flex-col gap-12">
      <Hero />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-12 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Shop</p>
              <h2 className="text-2xl font-semibold text-slate-900">Fresh arrivals</h2>
              <p className="text-slate-600">Browse our latest drops right from the homepage.</p>
            </div>
          </div>

          <HomeClient products={products} categories={categories} designThemes={designThemes} />
          {errorMessage ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex w-full justify-center pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200/50 transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              See all products
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl bg-sky-900/90 px-6 py-10 text-sky-50 shadow-lg shadow-sky-200/60">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Why Us</p>
            <h2 className="text-2xl font-semibold">Why Choose Fish Your Style?</h2>
            <p className="text-sky-100">
              These pillars echo the visuals you shared: delivery, personalization,
              and premium quality.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-2xl bg-white/10 p-6 shadow-inner shadow-sky-950/30 backdrop-blur"
              >
                <div className="text-2xl">🌟</div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sky-100">{reason.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
