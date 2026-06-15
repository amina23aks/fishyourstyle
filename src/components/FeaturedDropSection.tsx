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

  return (
    <section
      id="flow-drop"
      className="space-y-9 rounded-[2rem] border border-cyan-100/15 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(214,188,133,0.20),transparent_34%),linear-gradient(135deg,rgba(11,74,111,0.96),rgba(20,58,91,0.97)_48%,rgba(35,77,103,0.94))] px-4 py-12 text-white shadow-[0_24px_70px_rgba(8,47,73,0.36)] sm:space-y-10 sm:px-6 md:py-16 lg:px-10"
    >
      <div className="max-w-3xl space-y-4 sm:space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-50/85">
          {drop.label}
        </p>
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {drop.title}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-sky-50/85 sm:text-lg sm:leading-8">
            {drop.subtitle}
          </p>
        </div>
      </div>

      {dropProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 min-[380px]:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
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
