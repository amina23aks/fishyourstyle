"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";

import { useCart, type CartItem } from "@/context/cart";
import { AnimatePresence, motion } from "@/lib/motion";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, totals, totalQuantity, removeItem, updateQty, clearCart } =
    useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    wilaya: "",
    address: "",
  });
  const [mounted, setMounted] = useState(false);

  const hasItems = items.length > 0;

  const handleDecrease = (item: CartItem) => {
    if (item.quantity <= 1) {
      removeItem(item.id, item.variantKey);
      return;
    }
    updateQty(item.id, item.variantKey, item.quantity - 1);
  };

  const handleIncrease = (item: CartItem) => {
    updateQty(item.id, item.variantKey, item.quantity + 1);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasItems) return;

    if (!form.fullName || !form.phone || !form.wilaya || !form.address) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    console.log("Quick checkout", { form, items, subtotal: totals.subtotal });
    clearCart();
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const summaryLines = useMemo(
    () => [
      { label: "Subtotal", value: formatCurrency(totals.subtotal) },
      { label: "Shipping", value: "Calculated at checkout" },
      { label: "Payment", value: "Cash on delivery" },
    ],
    [totals.subtotal],
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close cart"
            onClick={onClose}
            className="absolute inset-0 z-0 h-full w-full bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative z-10 ml-auto flex h-full max-h-screen w-full max-w-md min-w-[320px] flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950/90 text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Cart</p>
                <h2 className="text-lg font-semibold text-white">Your cart</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-sky-50 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Close
              </button>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                {!hasItems ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-sky-100">Your cart is empty.</p>
                    <Link
                      href="/shop"
                      onClick={onClose}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      Back to shop
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li
                        key={item.variantKey}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/30"
                      >
                        <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-white/10">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white line-clamp-2">{item.name}</p>
                              <p className="text-xs text-sky-200">{item.colorName} · {item.size}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id, item.variantKey)}
                              className="text-xs text-sky-300 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:underline"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-sm text-white">
                            <div className="flex items-center gap-2">
                              <motion.button
                                type="button"
                                onClick={() => handleDecrease(item)}
                                whileTap={{ scale: 0.9 }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                aria-label="Decrease quantity"
                              >
                                −
                              </motion.button>
                              <span className="min-w-[24px] text-center tabular-nums">{item.quantity}</span>
                              <motion.button
                                type="button"
                                onClick={() => handleIncrease(item)}
                                whileTap={{ scale: 0.9 }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                aria-label="Increase quantity"
                              >
                                +
                              </motion.button>
                            </div>
                            <div className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-sky-200">
                    <span>{totalQuantity} item{totalQuantity === 1 ? "" : "s"}</span>
                    <span>Total</span>
                  </div>
                  {summaryLines.map((line) => (
                    <div
                      key={line.label}
                      className="flex items-center justify-between text-sm text-sky-100"
                    >
                      <span>{line.label}</span>
                      <span className="tabular-nums text-white">{line.value}</span>
                    </div>
                  ))}
                </div>

                {hasItems && (
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-white/20 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    Go to checkout page
                  </Link>
                )}

                {hasItems && (
                  <form className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4" onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between text-sm font-semibold text-white">
                      <span>Quick delivery info</span>
                      <span className="text-xs text-sky-200">COD</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-sky-100" htmlFor="drawer-full-name">
                        Full name<span className="text-rose-200"> *</span>
                      </label>
                      <input
                        id="drawer-full-name"
                        value={form.fullName}
                        onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                        className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-sky-100" htmlFor="drawer-phone">
                        Phone<span className="text-rose-200"> *</span>
                      </label>
                      <input
                        id="drawer-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-sky-100" htmlFor="drawer-wilaya">
                        Wilaya<span className="text-rose-200"> *</span>
                      </label>
                      <input
                        id="drawer-wilaya"
                        value={form.wilaya}
                        onChange={(event) => setForm((prev) => ({ ...prev, wilaya: event.target.value }))}
                        className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-sky-100" htmlFor="drawer-address">
                        Address<span className="text-rose-200"> *</span>
                      </label>
                      <textarea
                        id="drawer-address"
                        value={form.address}
                        onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                        className="min-h-[72px] w-full resize-none rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        required
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileTap={{ scale: 0.97 }}
                      className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-sky-100 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-white/20 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Submitting..." : "Confirm order"}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
