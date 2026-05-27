"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { normalizeCartItem, useCart } from "@/context/cart";
import { ColorDot } from "@/components/ColorDot";
import { colorCodeToHex } from "@/lib/colorUtils";
import { doc, onSnapshot } from "firebase/firestore";
import {
  getEconomicShippingByWilaya,
  type ShippingMode,
} from "@/data/shipping";
import type { NewOrder, OrderItem } from "@/types/order";
import { useAuth } from "@/context/auth";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";
import { normalizeProductStock } from "@/lib/stock";
import { getDb } from "@/lib/firebaseClient";
import { submitOrder } from "@/lib/ordersClient";
import { initiateCheckout, purchase } from "@/lib/metaPixel";
import { useLocale, useTranslations } from "@/i18n/I18nProvider";
import { localizePathname } from "@/i18n/paths";
import { isValidAlgeriaPhone } from "@/lib/algeriaPhone";
import { ALGERIA_WILAYAS, normalizeWilaya } from "@/data/algeriaWilayas";

type CheckoutFormState = {
  fullName: string;
  phone: string;
  wilaya: string;
  address: string;
  notes: string;
  company: string;
};

export default function CheckoutClient() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { items, totals, clearCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    phone: "",
    wilaya: "",
    address: "",
    notes: "",
    company: "",
  });
  const [deliveryMode, setDeliveryMode] = useState<ShippingMode>("home");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);
  const [loyaltyRewardAvailable, setLoyaltyRewardAvailable] = useState(false);
  const [loyaltyRewardPercent, setLoyaltyRewardPercent] = useState(8);
  const initiateCheckoutTrackedRef = useRef(false);

  const hasItems = items.length > 0;

  const shippingPrice = useMemo(() => {
    if (!form.wilaya) return null;
    const wilayaData = getEconomicShippingByWilaya(form.wilaya);
    if (!wilayaData) return null;
    return deliveryMode === "home" ? wilayaData.home : wilayaData.desk;
  }, [deliveryMode, form.wilaya]);

  const loyaltyDiscountAmount = useMemo(() => {
    if (!user || !loyaltyRewardAvailable) return 0;
    if (loyaltyRewardPercent <= 0) return 0;
    return Math.round((totals.subtotal * loyaltyRewardPercent) / 100);
  }, [loyaltyRewardAvailable, loyaltyRewardPercent, totals.subtotal, user]);

  const grandTotal = useMemo(() => {
    const shippingTotal = shippingPrice ?? 0;
    return Math.max(0, totals.subtotal + shippingTotal - loyaltyDiscountAmount);
  }, [loyaltyDiscountAmount, shippingPrice, totals.subtotal]);

  const customerEmail = user?.email?.trim() || undefined;

  useEffect(() => {
    if (!hasItems) {
      initiateCheckoutTrackedRef.current = false;
      return;
    }
    if (initiateCheckoutTrackedRef.current) return;
    const checkoutItems = items.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
    }));
    // Meta Pixel: InitiateCheckout event when the checkout flow starts.
    initiateCheckout({
      value: grandTotal,
      currency: "DZD",
      items: checkoutItems,
    });
    initiateCheckoutTrackedRef.current = true;
  }, [grandTotal, hasItems, items]);

  useEffect(() => {
    if (!user) {
      setLoyaltyRewardAvailable(false);
      setLoyaltyRewardPercent(8);
      return;
    }

    const db = getDb();
    if (!db) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      const data = snapshot.data();
      setLoyaltyRewardAvailable(Boolean(data?.loyaltyRewardAvailable));
      setLoyaltyRewardPercent(
        typeof data?.loyaltyRewardPercent === "number" ? data.loyaltyRewardPercent : 8
      );
    });

    return () => unsubscribe();
  }, [user]);

  const handleChange = (field: keyof CheckoutFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasItems) {
      return;
    }

    setError(null);
    setSuccess(null);

    // Validate required delivery fields. Email is only taken from authenticated users.

    const normalizedWilaya = normalizeWilaya(form.wilaya);

    if (!form.fullName || !form.phone || !normalizedWilaya || !form.address) {
      setError(t("checkout.errorRequiredFields"));
      return;
    }

    if (!isValidAlgeriaPhone(form.phone.trim())) {
      setError(t("checkout.errorInvalidPhone"));
      return;
    }


    if (shippingPrice == null) {
      setError(t("checkout.errorSelectWilaya"));
      return;
    }

    setIsSubmitting(true);

    const normalizedItems = items.map((item) => normalizeCartItem(item));
    const hasOutOfStock = normalizedItems.some((item) => {
      const stockState = normalizeProductStock({
        stockMode: item.stockMode,
        stockQty: item.stockQty,
      });
      return stockState.stockMode === "limited" && !stockState.isAvailable;
    });
    if (hasOutOfStock) {
      setError(t("checkout.errorOutOfStock"));
      setIsSubmitting(false);
      return;
    }
    /*
     * Testing checklist:
     * - Unlimited product adds to cart and checkout succeeds.
     * - Limited product with stockQty=0 is blocked.
     * - Limited product decrements on order creation.
     * - New order export shows category/design populated.
     */
    const analyticsItems = normalizedItems.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));
    const analyticsTotal =
      shippingPrice == null
        ? totals.subtotal - loyaltyDiscountAmount
        : totals.subtotal + shippingPrice - loyaltyDiscountAmount;

    trackBeginCheckout({
      value: analyticsTotal,
      currency: "DZD",
      items: analyticsItems,
    });

    try {
      // Map cart items to order items
      const orderItems: OrderItem[] = normalizedItems.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        category: item.category,
        design: item.design,
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
        customerEmail: customerEmail || undefined,
        items: orderItems,
        shipping: {
          customerName: form.fullName,
          phone: form.phone.trim(),
          wilaya: normalizedWilaya,
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
      const response = await submitOrder(newOrder, user ?? null, { company: form.company.trim() });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData?.error && errorData.error.includes("Some items are no longer available")) {
          setError(t("checkout.errorRefreshCart"));
          setIsSubmitting(false);
          return;
        }
        // For all other errors, show error but do not throw stack in dev for expected 400
        setError(errorData.error || t("checkout.errorCreateOrder"));
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      const orderId = data.orderId;

      if (orderId) {
        trackPurchase({
          transaction_id: orderId,
          value: analyticsTotal,
          currency: "DZD",
          shipping: shippingPrice ?? undefined,
          items: analyticsItems,
        });
        // Meta Pixel: Purchase event after successful order creation.
        purchase({
          value: analyticsTotal,
          currency: "DZD",
          orderId,
          items: normalizedItems.map((item) => ({
            id: item.id,
            price: item.price,
            quantity: item.quantity,
          })),
        });
      }

      // Clear cart on success
      clearCart();

      // Show success state
      setSuccess({ orderId });

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`${localizePathname(locale, "/orders")}?status=success&orderId=${orderId}`);
      }, 2000);
    } catch (err) {
      console.error("[CheckoutClient] Error in handleSubmit:", err);
      const errorMessage = err instanceof Error ? err.message : t("common.unexpectedError");
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <main className="space-y-6 lg:space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">{t("checkout.title")}</p>
          <h1 className="text-3xl font-semibold text-white">{t("checkout.confirmTitle")}</h1>
          <p className="max-w-2xl text-sm text-sky-100">
            {t("checkout.subtitlePrefix")}
            <span className="font-semibold text-white"> {t("checkout.economicShipping")} </span>
            {t("checkout.subtitleSuffix")}
          </p>
        </header>

        {!user && (
          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-inner shadow-sky-900/30">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sky-100">
              <div>
                <p className="text-white">{t("checkout.guestTitle")}</p>
                <p className="text-xs text-sky-200">{t("checkout.guestNote")}</p>
              </div>
              <Link
                href={{
                  pathname: localizePathname(locale, "/account"),
                  query: { returnTo: localizePathname(locale, "/checkout") },
                }}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                {t("checkout.loginCta")}
              </Link>
            </div>
          </section>
        )}

        {!hasItems ? (
          <section className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center text-sm text-sky-100">
            {t("checkout.emptyCart")}
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start"
          >
            <section className="order-2 space-y-4 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30 lg:order-1">
              <h2 className="text-sm font-semibold text-white">{t("checkout.deliveryDetails")}</h2>

              <input
                type="text"
                name="company"
                value={form.company}
                onChange={(event) => handleChange("company", event.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="fullName">
                    {t("checkout.fullNameLabel")}<span className="text-rose-200"> *</span>
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
                    {t("checkout.phoneLabel")}<span className="text-rose-200"> *</span>
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
                    {t("checkout.wilayaLabel")}<span className="text-rose-200"> *</span>
                  </label>
                  <input
                    id="wilaya"
                    type="text"
                    value={form.wilaya}
                    onChange={(event) => handleChange("wilaya", event.target.value)}
                    list="checkout-wilayas"
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    placeholder={t("checkout.wilayaPlaceholder")}
                    required
                  />
                  <datalist id="checkout-wilayas">
                    {ALGERIA_WILAYAS.map((wilaya) => (
                      <option key={wilaya.code} value={wilaya.label} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-sky-100">{t("delivery.mode")}</span>
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
                      {t("delivery.home")}
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
                      {t("delivery.desk")}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-sky-100" htmlFor="address">
                    {t("checkout.addressLabel")}<span className="text-rose-200"> *</span>
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
                    {t("checkout.notesLabel")} <span className="text-sky-300 text-xs">{t("checkout.notesOptional")}</span>
                  </label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(event) => handleChange("notes", event.target.value)}
                    className="min-h-[64px] w-full resize-none rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    placeholder={t("checkout.notesPlaceholder")}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200/60 bg-rose-500/15 px-4 py-3 text-sm text-rose-50 shadow-inner shadow-rose-900/30">
                  <p className="font-medium">{t("common.error")}</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-emerald-200/60 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50 shadow-inner shadow-emerald-900/30">
                  <p className="font-medium">{t("checkout.successTitle")}</p>
                  <p className="mt-1">{t("checkout.successOrderId").replace("{id}", success.orderId)}</p>
                  <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm sm:text-base">
                    <p className="font-medium text-white">{t("checkout.successNotePrimary")}</p>
                    <p className="mt-1 text-white/60">{t("checkout.successNoteSecondary")}</p>
                  </div>
                  <p className="mt-2 text-xs">{t("checkout.successRedirecting")}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || success !== null}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/20 transition hover:-translate-y-0.5 hover:border-slate-200/80 hover:shadow-[0_10px_24px_rgba(125,211,252,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t("checkout.submitSubmitting") : success ? t("checkout.submitSuccess") : t("checkout.submitDefault")}
              </button>
            </section>

            <aside className="order-1 space-y-4 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30 lg:sticky lg:top-8 lg:order-2">
              <h2 className="text-sm font-semibold text-white">{t("checkout.orderSummaryTitle")}</h2>

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
                  <span>{t("cart.subtotal")}</span>
                  <span className="tabular-nums">{totals.subtotal} DZD</span>
                </div>
                <div className="flex items-center justify-between text-sky-100">
                  <span>{t("cart.shipping")}</span>
                  <span className="tabular-nums">
                    {shippingPrice != null ? `${shippingPrice} DZD` : t("checkout.shippingSelectWilaya")}
                  </span>
                </div>
                {loyaltyRewardAvailable && loyaltyDiscountAmount > 0 ? (
                  <div className="flex items-center justify-between text-emerald-200">
                    <span>{t("checkout.loyaltyDiscountLabel").replace("{percent}", String(loyaltyRewardPercent))}</span>
                    <span className="tabular-nums">-{loyaltyDiscountAmount} DZD</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>{t("cart.total")}</span>
                  <span className="tabular-nums">{grandTotal} DZD</span>
                </div>
                <p className="pt-1 text-xs text-sky-200">
                  {t("checkout.shippingPaymentNote").replace(
                    "{mode}",
                    deliveryMode === "home" ? t("delivery.home") : t("delivery.desk"),
                  )}
                </p>
              </div>
            </aside>
          </form>
        )}
      </main>
    </PageShell>
  );
}
