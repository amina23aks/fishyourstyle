import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import OceanBackdrop from "@/components/OceanBackdrop";
import MetaPixelPageView from "@/components/MetaPixelPageView";
import CookiesBanner from "@/components/CookiesBanner";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import AuthModal from "@/components/AuthModal";
import { CartProvider } from "@/context/cart";
import { AuthProvider } from "@/context/auth";
import { AuthModalProvider } from "@/context/auth-modal";
import { FavoritesProvider } from "@/hooks/use-favorites";
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
    icon: "/logoF.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  return (
    <html lang="en">
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
          strategy="beforeInteractive"
        />
        {metaPixelId ? (
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
        {metaPixelId ? (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
        <Suspense fallback={null}>
          {metaPixelId ? <MetaPixelPageView /> : null}
          <AnalyticsProvider>
            <AuthProvider>
              <AuthModalProvider>
                <FavoritesProvider>
                  <CartProvider>
                    <OceanBackdrop />
                    <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden pt-20">
                      <Navbar />
                      <main className="flex-1">{children}</main>
                      <Footer />
                    </div>
                    <CookiesBanner />
                    <AuthModal />
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
