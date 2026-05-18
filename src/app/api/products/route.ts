import { NextResponse, type NextRequest } from "next/server";

import {
  fetchStorefrontProductsPage,
  type StorefrontProduct,
  type StorefrontProductsCursor,
} from "@/lib/storefront-products";
import type { Product } from "@/types/product";

function mapStorefrontToProduct(sp: StorefrontProduct): Product {
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
    soldOutSizes: sp.soldOutSizes,
    soldOutColorCodes: sp.soldOutColorCodes,
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
  } as Product & {
    designTheme?: string;
    tags?: string[];
    discountPercent?: number;
    stockMode?: "unlimited" | "limited";
    stockQty?: number;
    inStock?: boolean;
  };
}

function parseCursor(value: string | null): StorefrontProductsCursor | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith("{")) {
    return { id: trimmed.slice(0, 1500) };
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<StorefrontProductsCursor>;
    if (typeof parsed.id !== "string" || !parsed.id.trim()) return null;
    return { id: parsed.id.trim().slice(0, 1500) };
  } catch {
    return null;
  }
}

function cleanFilter(value: string | null): string | undefined {
  if (!value || value === "all") return undefined;
  return value.trim().slice(0, 80);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageSize = Number(searchParams.get("pageSize") ?? 8);
  const page = await fetchStorefrontProductsPage({
    pageSize,
    cursor: parseCursor(searchParams.get("cursor")),
    category: cleanFilter(searchParams.get("category")),
    designTheme: cleanFilter(searchParams.get("designTheme")),
  });
  const hasPrivateRequestHeaders = Boolean(
    request.headers.get("authorization") || request.headers.get("cookie"),
  );

  return NextResponse.json(
    {
      products: page.products.map(mapStorefrontToProduct),
      nextCursor: page.nextCursor,
    },
    {
      headers: {
        "Cache-Control": hasPrivateRequestHeaders
          ? "private, no-store"
          : "s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
