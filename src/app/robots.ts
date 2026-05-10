import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop/", "/en/shop/", "/fr/shop/", "/ar/shop/"],
        disallow: [
          "/api/",
          "/admin/",
          "/*/admin/",
          "/account/",
          "/*/account/",
          "/checkout/",
          "/*/checkout/",
          "/orders/",
          "/*/orders/",
          "/favorites/",
          "/*/favorites/",
          "/wishlist/",
          "/*/wishlist/",
          "/cart/",
          "/*/cart/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
