import { ProductCard } from "@/app/[locale]/shop/product-card";
import type { StorefrontProduct } from "@/lib/storefront-products";
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

export default function FeaturedDropSection({ drop, products }: Props) {
  if (!drop.active) return null;

  const dropProducts = products
    .slice(0, drop.maxProducts)
    .map(mapStorefrontToProduct);
  const productGridClassName =
    dropProducts.length < 4
      ? "mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:gap-5 lg:gap-6"
      : "grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6";

  return (
    <section
      id="flow-drop"
      className="space-y-6 rounded-[1.75rem] border border-cyan-50/15 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.20),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(214,188,133,0.16),transparent_30%),linear-gradient(135deg,rgba(18,91,128,0.94),rgba(33,82,111,0.95)_52%,rgba(62,101,118,0.90))] px-4 py-8 text-white shadow-[0_18px_48px_rgba(8,47,73,0.26)] sm:space-y-7 sm:px-6 md:py-10 lg:px-8"
    >
      <div className="max-w-2xl space-y-3 text-left sm:space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-cyan-50/80">
          {drop.label}
        </p>
        <div className="space-y-2.5 sm:space-y-3">
          <h2 className="text-2xl font-semibold uppercase tracking-[0.10em] text-white sm:text-4xl">
            {drop.title}
          </h2>
          <p className="max-w-xl text-sm leading-6 text-sky-50/82 sm:text-base sm:leading-7">
            {drop.subtitle}
          </p>
        </div>
      </div>

      {dropProducts.length > 0 ? (
        <div className={productGridClassName}>
          {dropProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-cyan-50/15 bg-white/[0.08] p-6 text-center text-sm text-white/80">
          FLOW products are coming soon.
        </div>
      )}
    </section>
  );
}
