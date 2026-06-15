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
    "grid justify-start gap-5 [grid-template-columns:minmax(0,240px)] min-[380px]:[grid-template-columns:repeat(auto-fit,minmax(150px,240px))] sm:gap-6 lg:gap-8";

  return (
    <section
      id="flow-drop"
      className="space-y-6 rounded-[1.75rem] border border-cyan-100/15 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(214,188,133,0.14),transparent_34%),linear-gradient(135deg,rgba(10,68,101,0.96),rgba(14,49,77,0.97)_52%,rgba(75,91,94,0.74))] px-4 py-7 text-white shadow-[0_18px_52px_rgba(8,47,73,0.34)] sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mx-auto max-w-2xl space-y-3 text-center sm:space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-cyan-50/80">
          {drop.title}
        </p>
        <div className="space-y-2.5 sm:space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {drop.label}
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-6 text-sky-50/84 sm:text-base sm:leading-7">
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
