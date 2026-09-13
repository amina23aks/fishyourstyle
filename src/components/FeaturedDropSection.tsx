import { ProductCard } from "@/app/[locale]/shop/product-card";
import type { StorefrontProduct } from "@/lib/storefront-products";
import type { Product } from "@/types/product";
import { calculateMentalistBundle } from "@/lib/mentalist-bundle";

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
  dropSlug: string;
  products: StorefrontProduct[];
};

function mapStorefrontToProduct(sp: StorefrontProduct): FeaturedDropProduct {
  const mainImage = sp.images?.main || "/placeholder.png";
  const gallery = sp.images?.gallery ?? [];
  const colors = (sp.colors ?? []).map((color) => {
    if (typeof color === "string") {
      return { id: color, labelFr: color, labelAr: color };
    }
    const id = typeof color.id === "string" && color.id ? color.id : mainImage;
    const labelFr =
      typeof color.labelFr === "string" && color.labelFr ? color.labelFr : id;
    const labelAr =
      typeof color.labelAr === "string" && color.labelAr
        ? color.labelAr
        : labelFr;
    const image =
      typeof color.image === "string" && color.image ? color.image : undefined;
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
    imageColorAssignments: sp.imageColorAssignments,
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

export default function FeaturedDropSection({ drop, dropSlug, products }: Props) {
  if (!drop.active) return null;

  const dropProducts = products
    .slice(0, drop.maxProducts)
    .map(mapStorefrontToProduct);
  const productGridClassName =
    "grid grid-cols-1 justify-start gap-5 min-[380px]:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8";
  const isMentalist = dropSlug === "mentalist";
  const promoTiers = [1, 2, 3].map(calculateMentalistBundle);

  return (
    <section
      id={`${dropSlug}-drop`}
      className={isMentalist
        ? "relative isolate space-y-6 overflow-hidden rounded-[1.75rem] border border-[#B51F24]/45 bg-[#0B0B0B] px-4 py-6 text-[#F3E9D7] shadow-[0_18px_52px_rgba(11,11,11,0.45)] sm:px-6 sm:py-8 lg:px-8"
        : "space-y-6 rounded-[1.75rem] border border-white/15 bg-slate-900 px-4 py-7 text-white sm:px-6 sm:py-8 lg:px-8"}
    >
      {isMentalist ? <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-[#B51F24]/20 blur-3xl" /> : null}
      <div className="mx-auto max-w-2xl space-y-3 text-center sm:space-y-4">
        <p className={isMentalist ? "text-[11px] font-semibold uppercase tracking-[0.36em] text-[#D34832]" : "text-[11px] font-semibold uppercase tracking-[0.36em] text-white/80"}>
          {drop.title}
        </p>
        <div className="space-y-2.5 sm:space-y-3">
          <h2 className={isMentalist ? "text-3xl font-semibold tracking-[0.04em] text-[#F3E9D7] sm:text-4xl" : "text-3xl font-semibold tracking-tight text-white sm:text-4xl"}>
            {drop.label}
          </h2>
          {drop.subtitle ? (
            <p className={isMentalist ? "mx-auto max-w-xl text-sm leading-6 text-[#F3E9D7]/75 sm:text-base sm:leading-7" : "mx-auto max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7"}>
              {drop.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {isMentalist ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#B51F24]/45 bg-[#171313] p-3 sm:p-4">
          <div className="flex flex-col gap-1 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D34832]">Mix your Mentalist</p>
              <p className="mt-1 text-xs text-[#F3E9D7]/65">Mix any Mentalist designs. Discount applied automatically.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 min-[390px]:grid-cols-3">
            {promoTiers.map((tier) => (
              <div key={tier.quantity} className="rounded-xl border border-[#F3E9D7]/10 bg-[#0B0B0B] px-3 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F3E9D7]/65">{tier.quantity} {tier.quantity === 1 ? "Tee" : "Tees"}</p>
                <p className="mt-1 text-base font-bold tabular-nums text-[#F3E9D7]">{new Intl.NumberFormat("en-US").format(tier.total)} DZD</p>
                {tier.discount > 0 ? <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D34832]">Save {new Intl.NumberFormat("en-US").format(tier.discount)} DZD</p> : <span className="mt-1 block h-[15px]" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {dropProducts.length > 0 ? (
        <div className={productGridClassName}>
          {dropProducts.map((product) => (
            <div key={product.id} className="mx-auto w-full max-w-[240px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className={isMentalist ? "rounded-2xl border border-[#B51F24]/35 bg-[#171313] p-5 text-center text-sm text-[#F3E9D7]/75" : "rounded-2xl border border-white/15 bg-white/[0.08] p-6 text-center text-sm text-white/80"}>
          {isMentalist ? "The Mentalist products are coming soon." : "Featured products are coming soon."}
        </div>
      )}
    </section>
  );
}
