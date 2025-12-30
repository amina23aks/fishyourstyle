import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import OceanBackdrop from "@/components/OceanBackdrop";
import CookiesBanner from "@/components/CookiesBanner";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { CartProvider } from "@/context/cart";
import { AuthProvider } from "@/context/auth";
import { FavoritesProvider } from "@/hooks/use-favorites";
import "./globals.css";

export const metadata: Metadata = {
  title: "FishYourStyle – Streetwear for Sea Lovers",
  description: "Algerian streetwear brand inspired by the sea.",
  keywords: [
    "fish your style",
    "sea streetwear",
    "تيشيرتات",
    "هودي",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          type="module"
          strategy="afterInteractive"
        />
      </head>
      <body className="ocean-page relative flex min-h-screen flex-col overflow-x-hidden antialiased font-sans">
        <Suspense fallback={null}>
          <AnalyticsProvider>
            <AuthProvider>
              <FavoritesProvider>
                <CartProvider>
                  <OceanBackdrop />
                  <div className="relative z-10 flex min-h-screen flex-col">
                    <Navbar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <CookiesBanner />
                </CartProvider>
              </FavoritesProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
