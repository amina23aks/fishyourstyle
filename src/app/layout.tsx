import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OceanBackdrop from "@/components/OceanBackdrop";
import { CartProvider } from "@/context/cart";
import { AuthProvider } from "@/context/auth";
import { WishlistProvider } from "@/hooks/use-wishlist";
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
      <body className="ocean-page relative min-h-screen overflow-x-hidden antialiased font-sans">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <OceanBackdrop />
              <Navbar />
              <main className="relative z-10 flex w-full flex-1 flex-col">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
