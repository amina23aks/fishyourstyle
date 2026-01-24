import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { getAllProducts } from "@/lib/products";
import { buildLocalizedUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const staticPaths = ["/", "/shop"];

  locales.forEach((locale) => {
    staticPaths.forEach((pathname) => {
      entries.push({
        url: buildLocalizedUrl(locale, pathname),
      });
    });
  });

  const products = getAllProducts();
  products.forEach((product) => {
    locales.forEach((locale) => {
      entries.push({
        url: buildLocalizedUrl(locale, `/shop/${product.slug}`),
      });
    });
  });

  return entries;
}
