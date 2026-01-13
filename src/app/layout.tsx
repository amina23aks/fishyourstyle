import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import OceanBackdrop from "@/components/OceanBackdrop";
import CookiesBanner from "@/components/CookiesBanner";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import AuthModal from "@/components/AuthModal";
import { CartProvider } from "@/context/cart";
import { AuthProvider } from "@/context/auth";
import { AuthModalProvider } from "@/context/auth-modal";
import { LanguageProvider } from "@/context/language";
import { ThemeProvider } from "@/context/theme";
import { FavoritesProvider } from "@/hooks/use-favorites";
            <ThemeProvider>
              <LanguageProvider>
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
              </LanguageProvider>
            </ThemeProvider>
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
      <body
        className="ocean-page relative flex min-h-screen flex-col overflow-x-hidden antialiased font-sans"
        data-theme="light"
      >
        <Suspense fallback={null}>
          <AnalyticsProvider>
            <ThemeProvider>
              <LanguageProvider>
                <AuthProvider>
                  <AuthModalProvider>
                    <FavoritesProvider>
                      <CartProvider>
                        <OceanBackdrop />
                        <div className="aurora-top relative z-10 flex min-h-screen flex-col overflow-x-hidden pt-20">
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
              </LanguageProvider>
            </ThemeProvider>
          </AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
