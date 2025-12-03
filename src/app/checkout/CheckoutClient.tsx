"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { useCart } from "@/context/cart";
import {
  ECONOMIC_SHIPPING,
  getEconomicShippingByWilaya,
  type ShippingMode,
} from "@/data/shipping";

type CheckoutFormState = {
  fullName: string;
  phone: string;
  wilaya: string;
  address: string;
  notes: string;
};

export default function CheckoutClient() {
  const router = useRouter();
  const { items, totals, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    phone: "",
    wilaya: "",
    address: "",
    notes: "",
  });
  const [deliveryMode, setDeliveryMode] = useState<ShippingMode>("home");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (field: keyof CheckoutFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasItems) return;

    if (!form.fullName || !form.phone || !form.wilaya || !form.address) {
      alert("Please fill in all required fields.");
      return;
    }

    if (shippingPrice == null) {
      alert("Please select a valid wilaya.");
      return;
    }

    setIsSubmitting(true);

    console.log("Checkout submission", {
      form,
      items,
      totals,
      shipping: {
        mode: deliveryMode,
        price: shippingPrice,
      },
      grandTotal,
      paymentMethod: "COD",
    });

    clearCart();
    router.push("/orders?status=success");
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Confirm order"}
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
                        <p className="text-sky-200">{item.colorName} · {item.size}</p>
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
