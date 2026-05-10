import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { Suspense } from "react";
import OceanBackdrop from "@/components/OceanBackdrop";
import MetaPixelPageView from "@/components/MetaPixelPageView";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { CartProvider } from "@/context/cart";
import { AuthProvider } from "@/context/auth";
import { AuthModalProvider } from "@/context/auth-modal";
import { FavoritesProvider } from "@/hooks/use-favorites";
import { getLocaleFromHeaders } from "@/i18n/locale";
import { getLocaleDirection } from "@/i18n/config";
import { getDefaultSocialImages, metadataBase, siteName, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fish Your Style — Streetwear for every mood",
  description: "Streetwear made for every style, every mood, and every moment.",
  keywords: [
    "fish your style",
    "streetwear for every mood",
    "streetwear",
    "style",
  ],
  icons: {
    icon: [
      { url: "/logoF.webp", type: "image/webp" },
      { url: "/logoF.png", type: "image/png" },
    ],
    shortcut: [
      { url: "/logoF.webp", type: "image/webp" },
      { url: "/logoF.png", type: "image/png" },
    ],
    apple: "/logoF.png",
  },
  metadataBase,
  alternates: {
    canonical: siteUrl,
    languages: {
      en: `${siteUrl}/en`,
      fr: `${siteUrl}/fr`,
      ar: `${siteUrl}/ar`,
      "x-default": `${siteUrl}/en`,
    },
  },
  openGraph: {
    type: "website",
    siteName,
    url: siteUrl,
    images: getDefaultSocialImages(),
  },
  twitter: {
    card: "summary_large_image",
    images: getDefaultSocialImages(),
  },
  verification: {
    google: "xhWDfYVWM4wYlyC0N8spspJoYrgmPcLaliR833kIz6c",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  // Run Meta Pixel only on Vercel production deployments.
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  const isVercelProduction = vercelEnv === "production";
  const enableMetaPixel = Boolean(metaPixelId && isVercelProduction);

  const locale = await getLocaleFromHeaders();
  const direction = getLocaleDirection(locale);

  return (
    <html lang={locale} dir={direction}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
  try {
    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "aurora");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch (error) {
    document.documentElement.removeAttribute("data-theme");
  }
})();`}
        </Script>
        <Script
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          type="module"
          strategy="lazyOnload"
        />
        {enableMetaPixel ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`}
          </Script>
        ) : null}
      </head>
      <body className="ocean-page relative flex min-h-screen flex-col overflow-x-hidden antialiased font-sans">
        {enableMetaPixel ? (
          <Image
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            alt=""
            width={1}
            height={1}
            unoptimized
            priority
            style={{ display: "none" }}
            aria-hidden="true"
          />
        ) : null}
        <Suspense fallback={null}>
          {enableMetaPixel ? <MetaPixelPageView /> : null}
          <AnalyticsProvider>
            <AuthProvider>
              <AuthModalProvider>
                <FavoritesProvider>
                  <CartProvider>
                    <OceanBackdrop />
                    {children}
                  </CartProvider>
                </FavoritesProvider>
              </AuthModalProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
