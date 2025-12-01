import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ocean-page min-h-screen antialiased`}
      >
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
