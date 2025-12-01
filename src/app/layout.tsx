import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OceanBackdrop from "@/components/OceanBackdrop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ocean-page relative min-h-screen overflow-x-hidden antialiased`}
      >
        <OceanBackdrop />
        <Navbar />
        <main className="relative z-10 flex w-full flex-1 flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
