import Link from "next/link";

import { ProductCard } from "@/app/[locale]/shop/product-card";
import type { StorefrontProduct } from "@/lib/storefront-products";
import { localizePathname } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";
import type { Product } from "@/types/product";

export type FeaturedDropConfig = {
  title: string;
  subtitle: string;
  label: string;
  buttonText: string;
  buttonLink: string;
  maxProducts: number;
  active: boolean;
};

type FeaturedDropProduct = Product & {
  designTheme?: string;
  tags?: string[];
  discountPercent?: number;
  stockMode?: "unlimited" | "limited";
  stockQty?: number;
  inStock?: boolean;
};

type Props = {
  drop: FeaturedDropConfig;
  locale: Locale;
  products: StorefrontProduct[];
};

function mapStorefrontToProduct(sp: StorefrontProduct): FeaturedDropProduct {
  const mainImage = sp.images?.main || "/placeholder.png";
  const gallery = sp.images?.gallery ?? [];
  const colors = (sp.colors ?? []).map((color) => {
    if (typeof color === "string") {
      return { id: color, labelFr: color, labelAr: color, image: mainImage };
    }
    const id = typeof color.id === "string" && color.id ? color.id : mainImage;
    const labelFr =
      typeof color.labelFr === "string" && color.labelFr ? color.labelFr : id;
    const labelAr =
      typeof color.labelAr === "string" && color.labelAr
        ? color.labelAr
        : labelFr;
    const image =
      typeof color.image === "string" && color.image ? color.image : mainImage;
    return { id, labelFr, labelAr, image };
  });

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
    colors,
    sizeGuideEnabled: sp.sizeGuideEnabled ?? false,
    sizeGuideImageUrl: sp.sizeGuideImageUrl ?? null,
    sizeGuideImagePublicId: sp.sizeGuideImagePublicId ?? null,
    images: { main: mainImage, gallery },
    descriptionFr: sp.description ?? "",
    descriptionAr: sp.description ?? "",
    status: "active",
    designTheme: sp.designTheme || "simple",
    tags: sp.tags ?? [],
    discountPercent: sp.discountPercent ?? 0,
    stockMode: sp.stockMode,
    stockQty: sp.stockQty,
    inStock: sp.inStock ?? true,
  };
}

export default function FeaturedDropSection({ drop, locale, products }: Props) {
  if (!drop.active) return null;

  const dropProducts = products
    .slice(0, drop.maxProducts)
    .map(mapStorefrontToProduct);

  return (
    <section
      id="flow-drop"
      className="space-y-10 rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_34%),linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.98)_54%,rgba(120,113,108,0.26))] px-5 py-14 text-white shadow-[0_24px_70px_rgba(2,6,23,0.5)] sm:px-8 md:py-16 lg:px-10"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100/85">
            {drop.label}
          </p>
          <div className="space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {drop.title}
            </h2>
            <p className="max-w-xl text-base leading-8 text-sky-50/[0.82] sm:text-lg">
              {drop.subtitle}
            </p>
          </div>
        </div>
        <Link
          href={localizePathname(locale, drop.buttonLink)}
          className="inline-flex items-center justify-center self-start rounded-full bg-stone-100 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 shadow-[0_12px_30px_rgba(14,165,233,0.22)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:self-auto"
        >
          {drop.buttonText}
          <span className="ml-2" aria-hidden>
            →
          </span>
        </Link>
      </div>

      {dropProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {dropProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-6 text-center text-sm text-white/80">
          FLOW products are coming soon.
        </div>
      )}
    </section>
  );
}
