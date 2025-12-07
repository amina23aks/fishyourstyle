"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart, type CartItem } from "@/context/cart";
import { AnimatePresence, motion } from "@/lib/motion";
import {
  ECONOMIC_SHIPPING,
  getEconomicShippingByWilaya,
  type ShippingMode,
  type WilayaShipping,
} from "@/data/shipping";
import type { NewOrder, OrderItem } from "@/types/order";
import { useAuth } from "@/context/auth";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("fr-DZ").format(value)} DZD`;

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, totals, totalQuantity, removeItem, updateQty, clearCart } =
    useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    wilaya: "",
    address: "",
    notes: "",
  });
  const [deliveryMode, setDeliveryMode] = useState<ShippingMode>("home");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);

  const hasItems = items.length > 0;

  const shippingPrice = useMemo(() => {
    if (!form.wilaya) return null;
    const wilayaData = getEconomicShippingByWilaya(form.wilaya);
    if (!wilayaData) return null;
    return deliveryMode === "home" ? wilayaData.home : wilayaData.desk;
  }, [deliveryMode, form.wilaya]);

  const grandTotal = useMemo(() => {
    if (shippingPrice == null) return totals.subtotal;
    return totals.subtotal + shippingPrice;
  }, [shippingPrice, totals.subtotal]);

  useEffect(() => {
    if (user?.email) {
      setForm((previous) =>
        previous.email
          ? previous
          : {
              ...previous,
              email: user.email ?? "",
            },
      );
    }
  }, [user]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasItems) return;

    setError(null);
    setSuccess(null);

    // Validate required fields (email is optional)
    if (!form.fullName || !form.phone || !form.wilaya || !form.address) {
      setError("Please fill in all required fields.");
      return;
    }

    // Email is optional - validate format only if provided
    if (form.email && form.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError("Please enter a valid email address or leave it blank.");
        return;
      }
    }

    if (shippingPrice == null) {
      setError("Please select a valid wilaya.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Map cart items to order items
      const orderItems: OrderItem[] = items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        currency: item.currency,
        image: item.image,
        colorName: item.colorName,
        colorCode: item.colorCode,
        size: item.size,
        quantity: item.quantity,
        variantKey: item.variantKey,
      }));

      // Build NewOrder object
      const newOrder: NewOrder = {
        userId: user?.uid,
        customerEmail: form.email || user?.email || undefined,
        items: orderItems,
        shipping: {
          customerName: form.fullName,
          phone: form.phone,
          wilaya: form.wilaya,
          address: form.address,
          mode: deliveryMode,
          price: shippingPrice,
        },
        notes: form.notes.trim() || undefined,
        subtotal: totals.subtotal,
        shippingCost: shippingPrice,
        total: grandTotal,
        paymentMethod: "COD",
        status: "pending",
      };

      // Send to API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create order. Please try again.");
      }

      const data = await response.json();
      const orderId = data.orderId;

      // Clear cart on success
      clearCart();

      // Show success state
      setSuccess({ orderId });

      // Close drawer and redirect after a short delay
      setTimeout(() => {
        onClose();
        router.push(`/orders?status=success&orderId=${orderId}`);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      setIsSubmitting(false);
    }
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
      {
        label: "Shipping",
        value:
          deliveryMode === "home"
            ? "A domicile (checkout)"
            : "Stop Desk (checkout)",
      },
      { label: "Payment", value: "Cash on delivery" },
    ],
    [deliveryMode, totals.subtotal],
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
            className="relative z-10 ml-auto flex h-full w-full max-w-md min-w-[320px]"
          >
            <div className="flex h-full w-full flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950/90 text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
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

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4 pb-6">
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
                    <p className="text-xs text-sky-200">
                      Shipping calculated at checkout. Choose A domicile or Stop Desk for delivery.
                    </p>
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
                      <label className="text-xs text-sky-100" htmlFor="drawer-email">
                        Email<span className="text-sky-300 text-xs"> (optional)</span>
                      </label>
                      <input
                        id="drawer-email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        placeholder="your@email.com"
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
                      <select
                        id="drawer-wilaya"
                        value={form.wilaya}
                        onChange={(event) => setForm((prev) => ({ ...prev, wilaya: event.target.value }))}
                        className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        required
                      >
                        <option value="">Select wilaya…</option>
                        {ECONOMIC_SHIPPING.map((entry: WilayaShipping) => (
                          <option key={entry.wilaya} value={entry.wilaya}>
                            {entry.wilaya}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-sky-100">Delivery mode</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryMode("home")}
                          aria-pressed={deliveryMode === "home"}
                          className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                            deliveryMode === "home"
                              ? "border-white bg-white text-slate-900"
                              : "border-white/20 bg-slate-950/70 text-white hover:border-white/40"
                          }`}
                        >
                          A domicile
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryMode("desk")}
                          aria-pressed={deliveryMode === "desk"}
                          className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                            deliveryMode === "desk"
                              ? "border-white bg-white text-slate-900"
                              : "border-white/20 bg-slate-950/70 text-white hover:border-white/40"
                          }`}
                        >
                          Stop Desk
                        </button>
                      </div>
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
                    <div className="space-y-2">
                      <label className="text-xs text-sky-100" htmlFor="drawer-notes">
                        Notes (optional)
                      </label>
                      <textarea
                        id="drawer-notes"
                        value={form.notes}
                        onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                        className="min-h-[64px] w-full resize-none rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        placeholder="Floor, apartment, delivery notes..."
                      />
                    </div>

                    {/* Order Summary - Display costs above button */}
                    <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between text-xs text-sky-100">
                        <span>Subtotal</span>
                        <span className="tabular-nums text-white">{formatCurrency(totals.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-sky-100">
                        <span>Shipping</span>
                        <span className="tabular-nums text-white">
                          {shippingPrice != null ? formatCurrency(shippingPrice) : "Select wilaya"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-semibold text-white">
                        <span>Total</span>
                        <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-lg border border-rose-200/60 bg-rose-500/15 px-3 py-2 text-xs text-rose-50 shadow-inner shadow-rose-900/30">
                        <p className="font-medium">Error</p>
                        <p className="mt-1">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="rounded-lg border border-emerald-200/60 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-50 shadow-inner shadow-emerald-900/30">
                        <p className="font-medium">Order placed successfully!</p>
                        <p className="mt-1">Order ID: {success.orderId}</p>
                        <p className="mt-2 text-[10px]">Redirecting to orders page...</p>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isSubmitting || success !== null}
                      whileTap={{ scale: 0.97 }}
                      className="flex w-full items-center justify-center rounded-xl border border-white/15 bg-sky-100 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-white/20 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Submitting..." : success ? "Order Placed!" : "Confirm order"}
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
