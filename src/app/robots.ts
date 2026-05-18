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
          "/admin",
          "/admin/",
          "/*/admin",
          "/*/admin/",
          "/account",
          "/account/",
          "/*/account",
          "/*/account/",
          "/cart",
          "/cart/",
          "/*/cart",
          "/*/cart/",
          "/checkout",
          "/checkout/",
          "/*/checkout",
          "/*/checkout/",
          "/orders",
          "/orders/",
          "/*/orders",
          "/*/orders/",
          "/favorites",
          "/favorites/",
          "/*/favorites",
          "/*/favorites/",
          "/wishlist",
          "/wishlist/",
          "/*/wishlist",
          "/*/wishlist/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
