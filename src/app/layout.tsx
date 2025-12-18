import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OceanBackdrop from "@/components/OceanBackdrop";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fish Your Style | موضة البحر للمستكشفين",
  description:
    "Sea-inspired streetwear crafted with Next.js + Firebase. ملابس مستوحاة من البحر بلمسة تقنية.",
  keywords: [
    "fish your style",
    "sea streetwear",
    "nextjs ecommerce",
    "موضة البحر",
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
      <body className="ocean-page min-h-screen antialiased">
        <OceanBackdrop />
        <Navbar />
        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
