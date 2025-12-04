"use client";

import Image from "next/image";
import { useRef } from "react";

import { AnimatedAddToCartButton } from "@/components/AnimatedAddToCartButton";
import { useFlyToCart } from "@/lib/useFlyToCart";

export default function FlyDemoPage() {
  const { cartRef, flyToCart } = useFlyToCart();
  const imgRef = useRef<HTMLImageElement | null>(null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-sky-300 to-sky-700 p-6 text-slate-900">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur">
        <button
          ref={cartRef}
          data-cart-target="true"
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-lg"
          aria-label="Panier"
        >
          🛒
        </button>

        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-b from-slate-100 to-slate-200">
            <Image
              ref={imgRef}
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"
              alt="Demo product"
              fill
              sizes="(min-width: 640px) 50vw, 90vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Demo product</h1>
              <p className="text-sm text-slate-600">Comfortable and soft — ideal for testing the fly-to-cart flow.</p>
              <p className="font-semibold text-slate-900">5 200 DZD</p>
            </div>

            <AnimatedAddToCartButton
              onClick={() => {
                if (imgRef.current) {
                  flyToCart(imgRef.current);
                }
              }}
              className="w-full justify-center"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
