"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Hero from "@/components/Hero";
import { logPageView } from "@/lib/firebaseAnalytics";
import { ProductCard } from "./shop/product-card";
import { getAllProducts } from "@/lib/products";

const reasons = [
  {
    title: "Delivery to 58 Wilaya",
    description: "موّفرين التوصيل لكل الولايات مع تتبع الطلب.",
  },
  {
    title: "Personalize Your Style",
    description: "جهزي لطلبات التخصيص والقطع المميزة قريبًا.",
  },
  {
    title: "Premium Quality",
    description: "أقمشة مختارة ولمسات بحرية في كل تصميم.",
  },
];

export default function Home() {
  useEffect(() => {
    logPageView("home");
  }, []);

  const products = useMemo(() => getAllProducts().slice(0, 4), []);

  return (
    <div className="flex w-full flex-col gap-12">
      <Hero />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-12 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Shop</p>
              <h2 className="text-2xl font-semibold text-slate-900">Fresh arrivals</h2>
              <p className="text-slate-600">Browse our latest drops right from the homepage.</p>
            </div>
            <Link
              href="/shop"
              className="hidden items-center gap-2 rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200/50 transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:inline-flex"
            >
              See all products
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          <Link
            href="/shop"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200/50 transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:hidden"
          >
            See all products
            <span aria-hidden>→</span>
          </Link>
        </section>

        <section className="space-y-4 rounded-3xl bg-sky-900/90 px-6 py-10 text-sky-50 shadow-lg shadow-sky-200/60">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Why Us</p>
            <h2 className="text-2xl font-semibold">Why Choose Fish Your Style?</h2>
            <p className="text-sky-100">
              These pillars echo the visuals you shared: delivery, personalization,
              and premium quality.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-2xl bg-white/10 p-6 shadow-inner shadow-sky-950/30 backdrop-blur"
              >
                <div className="text-2xl">🌟</div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sky-100">{reason.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
