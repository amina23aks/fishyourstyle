import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { buildLocalizedUrl } from "@/lib/seo";
import { fetchAllStorefrontProducts, type StorefrontProduct } from "@/lib/storefront-products";

const staticPaths = ["/", "/shop", "/faq", "/contact", "/shipping", "/terms", "/privacy-policy"];

function productSlug(product: StorefrontProduct): string | null {
  const slug = typeof product.slug === "string" ? product.slug.trim() : "";
  return slug || null;
}

async function getSitemapProducts(): Promise<StorefrontProduct[]> {
  const firestoreProducts = await fetchAllStorefrontProducts();
  return firestoreProducts.filter((product) => product.status === "active" && productSlug(product));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    staticPaths.forEach((pathname) => {
      entries.push({
        url: buildLocalizedUrl(locale, pathname),
        lastModified: now,
        changeFrequency: pathname === "/shop" ? "daily" : "weekly",
        priority: pathname === "/" ? 1 : pathname === "/shop" ? 0.9 : 0.6,
      });
    });
  });

  const seenProductUrls = new Set<string>();
  const products = await getSitemapProducts();
  products.forEach((product) => {
    const slug = productSlug(product);
    if (!slug) return;

    locales.forEach((locale) => {
      const url = buildLocalizedUrl(locale, `/shop/${slug}`);
      if (seenProductUrls.has(url)) return;
      seenProductUrls.add(url);
      entries.push({
        url,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    });
  });

  return entries;
}
