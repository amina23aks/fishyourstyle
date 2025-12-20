"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { useCart } from "@/context/cart";
import { ColorDot } from "@/components/ColorDot";
import { colorCodeToHex } from "@/lib/colorUtils";
import {
  ECONOMIC_SHIPPING,
  getEconomicShippingByWilaya,
  type ShippingMode,
} from "@/data/shipping";
import type { NewOrder, OrderItem } from "@/types/order";
import { useAuth } from "@/context/auth";

type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
  wilaya: string;
  address: string;
  notes: string;
};

export default function CheckoutClient() {
  const router = useRouter();
  const { items, totals, clearCart } = useCart();
  const { user, signOut } = useAuth();
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    email: "",
    phone: "",
    wilaya: "",
    address: "",
    notes: "",
  });
  const [deliveryMode, setDeliveryMode] = useState<ShippingMode>("home");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleChange = (field: keyof CheckoutFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[CheckoutClient] handleSubmit called");
    console.log("[CheckoutClient] hasItems:", hasItems);
    console.log("[CheckoutClient] items:", items);
    console.log("[CheckoutClient] form:", form);
    console.log("[CheckoutClient] deliveryMode:", deliveryMode);
    console.log("[CheckoutClient] shippingPrice:", shippingPrice);

    if (!hasItems) {
      console.error("[CheckoutClient] Validation Failed: No items in cart");
      return;
    }

    setError(null);
    setSuccess(null);

    // Validate required fields (email is optional)
    console.log("[CheckoutClient] Validating required fields...");
    console.log("[CheckoutClient] Field validation check:", {
      fullName: !!form.fullName,
      phone: !!form.phone,
      wilaya: !!form.wilaya,
      address: !!form.address,
      email: form.email || "(optional, empty is OK)",
    });
    
    if (!form.fullName || !form.phone || !form.wilaya || !form.address) {
      console.error("[CheckoutClient] Validation Failed: Missing required fields", {
        fullName: !!form.fullName,
        phone: !!form.phone,
        wilaya: !!form.wilaya,
        address: !!form.address,
        email: form.email || "(optional, not checked)",
      });
      setError("Please fill in all required fields.");
      return;
    }
    
    // Email is optional - validate format only if provided
    if (form.email && form.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        console.error("[CheckoutClient] Validation Failed: Invalid email format");
        setError("Please enter a valid email address or leave it blank.");
        return;
      }
    }
    
    console.log("[CheckoutClient] Required fields validation passed. Email is optional and OK.");

    if (shippingPrice == null) {
      console.error("[CheckoutClient] Validation Failed: Invalid shipping price (null)");
      setError("Please select a valid wilaya.");
      return;
    }

    console.log("[CheckoutClient] All validations passed. Building order payload...");
    setIsSubmitting(true);

    try {
      // Map cart items to order items
      console.log("[CheckoutClient] Mapping cart items to order items...");
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
      console.log("[CheckoutClient] Order items mapped:", orderItems);

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

      console.log("[CheckoutClient] Validating payload:", newOrder);
      console.log("[CheckoutClient] Payload summary:", {
        itemsCount: newOrder.items.length,
        customerEmail: newOrder.customerEmail,
        shipping: {
          customerName: newOrder.shipping.customerName,
          phone: newOrder.shipping.phone,
          wilaya: newOrder.shipping.wilaya,
          mode: newOrder.shipping.mode,
          price: newOrder.shipping.price,
        },
        subtotal: newOrder.subtotal,
        shippingCost: newOrder.shippingCost,
        total: newOrder.total,
        paymentMethod: newOrder.paymentMethod,
        status: newOrder.status,
      });

      // Send to API
      console.log("[CheckoutClient] Sending POST request to /api/orders...");
      const token = await user?.getIdToken?.();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(newOrder),
      });
      console.log("[CheckoutClient] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData?.error && errorData.error.includes("Some items are no longer available")) {
          setError("Please refresh your cart.");
          setIsSubmitting(false);
          return;
        }
        // For all other errors, show error but do not throw stack in dev for expected 400
        setError(errorData.error || "Failed to create order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      console.log("[CheckoutClient] Order created successfully:", data);
      const orderId = data.orderId;
      console.log("[CheckoutClient] Order ID:", orderId);

      // Clear cart on success
      console.log("[CheckoutClient] Clearing cart...");
      clearCart();

      // Show success state
      setSuccess({ orderId });
      console.log("[CheckoutClient] Success state set, will redirect in 2 seconds...");

      // Redirect after a short delay
      setTimeout(() => {
        console.log("[CheckoutClient] Redirecting to orders page...");
        router.push(`/orders?status=success&orderId=${orderId}`);
      }, 2000);
    } catch (err) {
      console.error("[CheckoutClient] Error in handleSubmit:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      console.error("[CheckoutClient] Error message:", errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <main className="space-y-6 lg:space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Checkout</p>
          <h1 className="text-3xl font-semibold text-white">Confirm your order</h1>
          <p className="max-w-2xl text-sm text-sky-100">
            Delivery across all wilayas with
            <span className="font-semibold text-white"> Economic shipping </span>
            and cash on delivery (COD).
          </p>
        </header>

        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-inner shadow-sky-900/30">
          {user ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sky-100">
              <div>
                <p className="text-white">Logged in</p>
                <p className="text-xs text-sky-200">
                  Orders placed while signed in will be linked to your account.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                  {user.email || "Authenticated user"}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sky-100">
              <div>
                <p className="text-white">Guest checkout</p>
                <p className="text-xs text-sky-200">
                  You can complete your order without an account or log in to save it under your profile.
                </p>
              </div>
              <Link
                href={{ pathname: "/account", query: { returnTo: "/checkout" } }}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Log in or create account
              </Link>
            </div>
          )}
        </section>

        {!hasItems ? (
          <section className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center text-sm text-sky-100">
            Your cart is empty. Add items before checking out.
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start"
          >
            <section className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
              <h2 className="text-sm font-semibold text-white">Delivery details</h2>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="fullName">
                    Full name<span className="text-rose-200"> *</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={(event) => handleChange("fullName", event.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="email">
                    Email<span className="text-sky-300 text-xs"> (optional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="phone">
                    Phone number<span className="text-rose-200"> *</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="wilaya">
                    Wilaya<span className="text-rose-200"> *</span>
                  </label>
                  <select
                    id="wilaya"
                    value={form.wilaya}
                    onChange={(event) => handleChange("wilaya", event.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    required
                  >
                    <option value="" className="bg-slate-900 text-sky-900">
                      Select wilaya…
                    </option>
                    {ECONOMIC_SHIPPING.map((wilaya) => (
                      <option
                        key={wilaya.wilaya}
                        value={wilaya.wilaya}
                        className="bg-slate-900 text-white"
                      >
                        {wilaya.wilaya}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-sky-100">Delivery mode</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMode("home")}
                      className={`rounded-full border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                        deliveryMode === "home"
                          ? "border-white bg-white text-slate-900"
                          : "border-white/25 bg-white/5 text-white hover:border-white/40"
                      }`}
                      aria-pressed={deliveryMode === "home"}
                    >
                      A domicile
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMode("desk")}
                      className={`rounded-full border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                        deliveryMode === "desk"
                          ? "border-white bg-white text-slate-900"
                          : "border-white/25 bg-white/5 text-white hover:border-white/40"
                      }`}
                      aria-pressed={deliveryMode === "desk"}
                    >
                      Stop Desk
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="address">
                    Address<span className="text-rose-200"> *</span>
                  </label>
                  <textarea
                    id="address"
                    value={form.address}
                    onChange={(event) => handleChange("address", event.target.value)}
                    className="min-h-[80px] w-full resize-none rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="notes">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(event) => handleChange("notes", event.target.value)}
                    className="min-h-[64px] w-full resize-none rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    placeholder="Floor, apartment, preferred time..."
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200/60 bg-rose-500/15 px-4 py-3 text-sm text-rose-50 shadow-inner shadow-rose-900/30">
                  <p className="font-medium">Error</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-emerald-200/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50 shadow-inner shadow-emerald-900/30">
                  <p className="font-medium">Order placed successfully!</p>
                  <p className="mt-1">Order ID: {success.orderId}</p>
                  <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm sm:text-base">
                    <p className="font-medium text-white">
                      If you later log in with this same email, you’ll see your orders under the Orders page.
                    </p>
                    <p className="mt-1 text-white/60">
                      إذا سجّلت دخول لاحقًا بنفس هذا الإيميل، تقدري تشوفي طلباتك في صفحة Orders.
                    </p>
                  </div>
                  <p className="mt-2 text-xs">Redirecting to orders page...</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || success !== null}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : success ? "Order Placed!" : "Confirm order"}
              </button>
            </section>

            <aside className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30 lg:sticky lg:top-8">
              <h2 className="text-sm font-semibold text-white">Order summary</h2>

              <ul className="space-y-3 text-xs text-sky-100">
                {items.map((item) => (
                  <li
                    key={`${item.id}-${item.colorCode}-${item.size}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-2 text-[10px] font-semibold text-white">
                          ×{item.quantity}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <div className="flex items-center gap-1.5 text-sky-200">
                          <ColorDot hex={colorCodeToHex(item.colorCode)} size="sm" />
                          <span>{item.size}</span>
                        </div>
                      </div>
                    </div>
                    <p className="tabular-nums text-white">
                      {item.price * item.quantity} {item.currency}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm">
                <div className="flex items-center justify-between text-sky-100">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{totals.subtotal} DZD</span>
                </div>
                <div className="flex items-center justify-between text-sky-100">
                  <span>Shipping</span>
                  <span className="tabular-nums">
                    {shippingPrice != null ? `${shippingPrice} DZD` : "Select wilaya"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{grandTotal} DZD</span>
                </div>
                <p className="pt-1 text-xs text-sky-200">
                  Shipping prices based on Economic delivery (
                  {deliveryMode === "home" ? "A domicile" : "Stop Desk"}). Payment is
                  cash on delivery.
                </p>
              </div>
            </aside>
          </form>
        )}
      </main>
    </PageShell>
  );
}
