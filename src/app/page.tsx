"use client";

import { useEffect } from "react";
import Hero from "@/components/Hero";
import { logPageView } from "@/lib/firebaseAnalytics";

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

  return (
    <div className="flex w-full flex-col gap-12">
      <Hero />

      <section className="space-y-4 rounded-3xl bg-sky-900 px-6 py-10 text-sky-50 shadow-lg shadow-sky-200/60">
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
  );
}
