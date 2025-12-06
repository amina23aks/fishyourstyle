"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "@/lib/motion";
import PageShell from "@/components/PageShell";
import { useCart } from "@/context/cart";

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

export default function CartPage() {
  const { items, totals, removeItem, updateQty } = useCart();

  const handleDecrease = (item: typeof items[0]) => {
    if (item.quantity <= 1) {
      removeItem(item.id, item.variantKey);
      return;
    }
    updateQty(item.id, item.variantKey, item.quantity - 1);
  };

  const handleIncrease = (item: typeof items[0]) => {
    updateQty(item.id, item.variantKey, item.quantity + 1);
  };

  if (items.length === 0) {
    return (
      <PageShell>
        <section className="w-full space-y-6 rounded-3xl bg-white/10 p-8 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
          <div className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Cart</p>
            <h1 className="text-3xl font-semibold text-white">Your cart is empty</h1>
            <p className="max-w-2xl mx-auto text-sky-100">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
          </div>
          <div className="flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="space-y-6 lg:space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Cart</p>
          <h1 className="text-3xl font-semibold text-white">Your cart</h1>
          <p className="max-w-2xl text-sm text-sky-100">
            Review your items and proceed to checkout when ready.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <section className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
            <h2 className="text-sm font-semibold text-white">Cart items</h2>

            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.variantKey}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30"
                >
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white line-clamp-2">{item.name}</h3>
                        <p className="text-xs text-sky-200 mt-1">{item.colorName} · {item.size}</p>
                        <p className="text-xs text-sky-300 mt-1">{formatPrice(item.price)} each</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.variantKey)}
                        className="text-xs text-sky-300 underline-offset-4 hover:text-rose-200 focus-visible:outline-none focus-visible:underline transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          whileTap={{ scale: 0.9 }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </motion.button>
                        <span className="min-w-[32px] text-center text-sm font-medium text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <motion.button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          whileTap={{ scale: 0.9 }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </motion.button>
                      </div>
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30 lg:sticky lg:top-8">
            <h2 className="text-sm font-semibold text-white">Order summary</h2>

            <div className="space-y-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-sm text-sky-100">
                <span>Subtotal</span>
                <span className="tabular-nums text-white font-medium">{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-sky-200">
                <span>Items</span>
                <span className="tabular-nums">{items.length} {items.length === 1 ? "item" : "items"}</span>
              </div>
              <p className="pt-2 text-xs text-sky-200 border-t border-white/10">
                Shipping and payment details will be calculated at checkout.
              </p>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/shop"
              className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
