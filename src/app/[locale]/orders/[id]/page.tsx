"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import PageShell from "@/components/PageShell";
import { ECONOMIC_SHIPPING, getEconomicShippingByWilaya } from "@/data/shipping";
import type { Order, OrderItem, ShippingInfo } from "@/types/order";
import { getProductBySlug } from "@/lib/products";
import { ColorDot } from "@/components/ColorDot";
import { colorCodeToHex } from "@/lib/colorUtils";
import { getDb } from "@/lib/firebaseClient";
import { useAdmin } from "@/lib/admin";
import { Swatch } from "../../shop/swatch";
import { SoldOutTooltipWrapper } from "@/components/SoldOutTooltipWrapper";
import { buildProductColorOptions, buildProductSizeOptions, resolveSwatchHex } from "@/lib/product-variants";
import { useLocale, useTranslations } from "@/i18n/I18nProvider";
import { localizePathname } from "@/i18n/paths";

function toDateSafe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    const d = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (
    typeof value === "object" &&
    value &&
    "seconds" in value &&
    "nanoseconds" in value &&
    typeof (value as { seconds: unknown }).seconds === "number" &&
    typeof (value as { nanoseconds: unknown }).nanoseconds === "number"
  ) {
    const { seconds, nanoseconds } = value as { seconds: number; nanoseconds: number };
    const d = new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

type EditOrderModalProps = {
  order: Order;
  open: boolean;
  currentUser: { getIdToken: () => Promise<string> } | null;
  onClose: () => void;
  onUpdated: (updatedOrder: Order) => void;
  onError: (message: string) => void;
};

function EditOrderModal({ order, open, currentUser, onClose, onUpdated, onError }: EditOrderModalProps) {
  const t = useTranslations();
  const [shipping, setShipping] = useState<ShippingInfo>(order.shipping);
  const [notes, setNotes] = useState<string>(order.notes ?? "");
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setShipping(order.shipping);
      setNotes(order.notes ?? "");
      setItems(order.items);
      setLocalError(null);
    }
  }, [open, order]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const shippingCost = typeof shipping.price === "number" ? shipping.price : order.shippingCost;
  const total = subtotal + shippingCost;

  useEffect(() => {
    const selectedWilaya = getEconomicShippingByWilaya(shipping.wilaya);
    if (selectedWilaya) {
      const updatedPrice = shipping.mode === "desk" ? selectedWilaya.desk : selectedWilaya.home;
      setShipping((current) => ({ ...current, price: updatedPrice }));
    }
  }, [shipping.wilaya, shipping.mode]);

  const disabled = order.status !== "pending";

  const handleSave = async () => {
    if (disabled) {
      setLocalError(t("orders.editModalDisabledNote"));
      return;
    }

    setIsSaving(true);
    setLocalError(null);
    onError("");

    try {
      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error("Login required to edit or cancel this order.");
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipping,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || "Failed to update order";
        throw new Error(message);
      }

      const updatedOrder = (await response.json()) as Order;
      onUpdated(updatedOrder);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("common.unexpectedError");
      setLocalError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-8 sm:px-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/40 backdrop-blur-xl max-h-[82vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200">{t("orders.editModalTitle")}</p>
            <h3 className="text-xl font-semibold text-white">
              {t("orders.orderNumber").replace("{id}", order.id.slice(-8))}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {t("orders.editModalClose")}
          </button>
        </div>

        {disabled && (
          <div className="border-b border-white/10 bg-rose-500/15 px-5 py-3 text-sm text-rose-50">
            {t("orders.editModalDisabledNote")}
          </div>
        )}

        <div className="grid flex-1 gap-4 overflow-y-auto px-4 py-4 lg:grid-cols-[1.15fr_0.95fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/15 bg-white/5 p-3 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">{t("orders.editModalShippingTitle")}</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  {t("orders.editModalNameLabel")}
                  <input
                    value={shipping.customerName}
                    onChange={(e) => setShipping({ ...shipping, customerName: e.target.value })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    type="text"
                  />
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  {t("orders.editModalPhoneLabel")}
                  <input
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    type="tel"
                  />
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  {t("orders.editModalWilayaLabel")}
                  <select
                    value={shipping.wilaya}
                    onChange={(e) => {
                      const wilaya = e.target.value;
                      const pricing = getEconomicShippingByWilaya(wilaya);
                      const nextPrice = pricing
                        ? shipping.mode === "desk"
                          ? pricing.desk
                          : pricing.home
                        : shipping.price;
                      setShipping({ ...shipping, wilaya, price: nextPrice });
                    }}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60 bg-slate-900/40"
                  >
                    {ECONOMIC_SHIPPING.map((entry) => (
                      <option key={entry.wilaya} value={entry.wilaya} className="bg-slate-900">
                        {entry.wilaya}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  {t("orders.editModalAddressLabel")}
                  <input
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    type="text"
                  />
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1 md:col-span-2">
                  {t("orders.editModalDeliveryModeLabel")}
                  <select
                    value={shipping.mode}
                    onChange={(e) => {
                      const mode = e.target.value as ShippingInfo["mode"];
                      const pricing = getEconomicShippingByWilaya(shipping.wilaya);
                      const nextPrice = pricing ? (mode === "desk" ? pricing.desk : pricing.home) : shipping.price;
                      setShipping({ ...shipping, mode, price: nextPrice });
                    }}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60 bg-slate-900/40"
                  >
                    <option value="home">{t("delivery.home")}</option>
                    <option value="desk">{t("delivery.desk")}</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-3 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">{t("orders.editModalNotesTitle")}</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={disabled}
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
              />
            </section>
          </div>

          <div className="space-y-3 pb-1">
            <section className="rounded-2xl border border-white/15 bg-white/5 p-3 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">{t("orders.editModalItemsTitle")}</h4>
              <div className="space-y-3">
                {items.map((item, index) => {
                  const productDefinition = getProductBySlug(item.slug);
                  const colorOptions = productDefinition
                    ? buildProductColorOptions(productDefinition)
                    : [
                        {
                          hex: item.colorCode,
                          label: item.colorName ?? item.colorCode,
                          image: item.image,
                          soldOut: false,
                        },
                      ];
                  const sizeOptions = productDefinition
                    ? buildProductSizeOptions(productDefinition)
                    : [{ value: item.size, soldOut: false }];

                  return (
                    <div
                      key={item.variantKey || index}
                      className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">{item.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-sky-200 flex-wrap">
                            <ColorDot hex={colorCodeToHex(item.colorCode)} size="sm" />
                            <span className="text-white/80">{item.size}</span>
                          </div>
                          <p className="text-xs text-sky-100">
                            {new Intl.NumberFormat("fr-DZ").format(item.price)} {item.currency} {t("orders.eachLabel")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-sm font-semibold text-white">{t("orders.editModalQuantityLabel")}</span>
                          <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col text-xs text-sky-100 gap-1">
                          {t("orders.editModalColorLabel")}
                          {(() => {
                            const selectedLabel =
                              colorOptions.find((candidate) => candidate.hex === item.colorCode)?.label ??
                              item.colorName ??
                              "Color";

                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                {colorOptions.map((color) => {
                                  const isSelected = color.hex === item.colorCode;
                                  const isSoldOutColor = color.soldOut;
                                  return (
                                    <Swatch
                                      key={color.hex}
                                      label={color.label ?? color.hex}
                                      colorHex={resolveSwatchHex(color)}
                                      selected={isSelected}
                                      showLabel={false}
                                      size="xs"
                                      isSoldOut={isSoldOutColor}
                                      disabled={disabled || isSoldOutColor}
                                      onSelect={() => {
                                        if (disabled || isSoldOutColor) return;
                                        setItems((current) =>
                                          current.map((entry, idx) =>
                                            idx === index
                                              ? {
                                                  ...entry,
                                                  colorCode: color.hex,
                                                  colorName: color.label ?? color.hex,
                                                  image: color.image ?? item.image,
                                                }
                                              : entry,
                                          ),
                                        );
                                      }}
                                    />
                                  );
                                })}
                                <span className="text-sm font-semibold text-white sr-only">{selectedLabel}</span>
                              </div>
                            );
                          })()}
                        </label>
                        <label className="flex flex-col text-xs text-sky-100 gap-1">
                          {t("orders.editModalSizeLabel")}
                          <div className="flex flex-wrap gap-2">
                            {sizeOptions.map((sizeOption) => {
                              const isSoldOut = sizeOption.soldOut;
                              const isSelected = sizeOption.value === item.size;
                              return (
                                <SoldOutTooltipWrapper key={sizeOption.value} isSoldOut={isSoldOut} className="inline-flex">
                                  <button
                                    type="button"
                                    disabled={disabled || isSoldOut}
                                    onClick={() => {
                                      if (disabled || isSoldOut) return;
                                      setItems((current) =>
                                        current.map((entry, idx) =>
                                          idx === index ? { ...entry, size: sizeOption.value } : entry,
                                        ),
                                      );
                                    }}
                                    className={`relative rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:opacity-60 ${
                                      isSelected
                                        ? "border-white bg-white/15 text-white"
                                        : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                                    } ${isSoldOut ? "opacity-60 cursor-not-allowed" : ""}`}
                                  >
                                    <span className="relative inline-flex items-center justify-center">
                                      {sizeOption.value}
                                      {isSoldOut ? (
                                        <>
                                          <span className="pointer-events-none absolute h-[2px] w-5 -rotate-45 bg-red-400/80 mix-blend-multiply" />
                                          <span className="pointer-events-none absolute h-[2px] w-5 rotate-45 bg-red-400/80 mix-blend-multiply" />
                                        </>
                                      ) : null}
                                    </span>
                                  </button>
                                </SoldOutTooltipWrapper>
                              );
                            })}
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-3 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">{t("orders.editModalSummaryTitle")}</h4>
              <dl className="space-y-2 text-sm text-sky-100">
                <div className="flex items-center justify-between">
                  <dt>{t("orders.editModalSubtotalLabel")}</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(subtotal)} DZD
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>{t("orders.editModalShippingLabel")}</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(shippingCost)} DZD
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-base">
                  <dt className="font-semibold text-white">{t("orders.editModalTotalLabel")}</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(total)} DZD
                  </dd>
                </div>
              </dl>
            </section>

            {localError && (
              <div className="rounded-xl border border-rose-200/50 bg-rose-500/20 px-3 py-2 text-sm text-rose-50">
                {localError}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {t("orders.editModalCancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || disabled}
                className="inline-flex items-center justify-center rounded-xl border border-violet-200/40 bg-violet-500/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? t("orders.editModalSaving") : t("orders.editModalSave")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user, loading: authLoading, isAdmin } = useAdmin();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/track-order?orderId=${orderId}`);
      setIsLoading(false);
    }
  }, [authLoading, orderId, router, user]);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const db = getDb();
        if (!db) {
          throw new Error(t("orders.errorFetch"));
        }

        const orderRef = doc(db, "orders", orderId);
        const snapshot = await getDoc(orderRef);

        if (!snapshot.exists()) {
          setError(t("orders.orderNotFoundTitle"));
          return;
        }

        const data = snapshot.data();
        const fetchedOrder: Order = {
          id: snapshot.id,
          ...data,
          createdAt:
            typeof data.createdAt === "string"
              ? data.createdAt
              : data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : "",
        } as Order;

        const isOwner = fetchedOrder.userId && user?.uid ? fetchedOrder.userId === user.uid : false;
        const authorized = isOwner || isAdmin;

        if (!authorized) {
          setError(t("orders.errorNotAuthorized"));
          setOrder(null);
          return;
        }

        setOrder(fetchedOrder);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t("common.unexpectedError");
        setError(errorMessage);
        console.error("Failed to fetch order:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId && user && !authLoading) {
      fetchOrder();
    }
  }, [authLoading, isAdmin, orderId, t, user]);

  useEffect(() => {
    const wantsEdit = searchParams.get("edit") === "true";
    if (order && wantsEdit && order.status === "pending") {
      setShowEditModal(true);
      setToastMessage(null);
      setEditError(null);
    }
  }, [order, searchParams]);

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error("Login required to edit or cancel this order.");
      }
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || t("orders.cancelFailed");
        const friendlyMessage =
          message === "Only pending orders can be cancelled."
            ? t("orders.cancelNotPending")
            : message;
        throw new Error(friendlyMessage);
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setToastMessage(t("orders.toastCancelled"));
      setShowCancelConfirm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("common.unexpectedError");
      setCancelError(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOrderUpdated = (updated: Order) => {
    setOrder(updated);
    setEditError(null);
    setToastMessage(t("orders.toastUpdated"));
    router.push(`${localizePathname(locale, "/orders")}?status=updated&orderId=${updated.id}`);
  };

  // Helper to format status badge
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-500/40";
      case "confirmed":
        return "bg-blue-500/20 text-blue-200 border-blue-500/40";
      case "shipped":
        return "bg-purple-500/20 text-purple-200 border-purple-500/40";
      case "delivered":
        return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
      case "cancelled":
        return "bg-rose-500/20 text-rose-200 border-rose-500/40";
      default:
        return "bg-sky-500/20 text-sky-200 border-sky-500/40";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return t("orders.status.delivered");
      case "shipped":
        return t("orders.status.shipped");
      case "cancelled":
        return t("orders.status.cancelled");
      case "pending":
      case "confirmed":
        return t("orders.status.processing");
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageShell>
        <main className="space-y-6 lg:space-y-8">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 shadow-sm shadow-sky-900/30 backdrop-blur animate-pulse">
            <div className="space-y-4">
              <div className="h-8 bg-white/10 rounded w-48"></div>
              <div className="h-6 bg-white/10 rounded w-32"></div>
              <div className="h-4 bg-white/10 rounded w-64"></div>
            </div>
          </div>
        </main>
      </PageShell>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <PageShell>
        <main className="space-y-6 lg:space-y-8">
          <div className="rounded-2xl border border-rose-200/60 bg-rose-500/15 p-8 text-rose-50 shadow-inner shadow-rose-900/30">
            <p className="font-medium text-lg mb-2">{t("orders.orderNotFoundTitle")}</p>
            <p className="text-sm mb-6">{error || t("orders.orderNotFoundSubtitle")}</p>
            <Link
              href={localizePathname(locale, "/orders")}
              className="inline-flex items-center rounded-lg border border-rose-200/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
            >
              {t("orders.backToOrders")}
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  const canCancel = order.status === "pending";
  const canEdit = order.status === "pending";
  const createdAtDate = toDateSafe(order.createdAt);

  if (!authLoading && !user) {
    return null;
  }

  return (
    <PageShell>
      <main
        className="space-y-6 lg:space-y-8"
        data-can-cancel={canCancel}
        data-can-edit={canEdit}
      >
        {toastMessage && (
          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-500/15 px-4 py-3 text-emerald-50 shadow-inner shadow-emerald-900/30">
            <p className="font-medium">{toastMessage}</p>
          </div>
        )}
        <header className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200">{t("orders.orderDetailsTitle")}</p>
              <h1 className="text-3xl font-semibold text-white">
                {t("orders.orderNumber").replace("{id}", order.id.slice(-8))}
              </h1>
            </div>
            {canEdit && (
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setToastMessage(null);
                  setEditError(null);
                }}
                className="inline-flex items-center justify-center self-start rounded-xl border border-violet-200/50 bg-violet-500/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                {t("orders.editOrderButton")}
              </button>
            )}
          </div>
          {!canEdit && (
            <p className="text-sm text-sky-200">{t("orders.editOrderLockedNote")}</p>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Order header card */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-sky-200">
                    {t("orders.placedOn").replace(
                      "{date}",
                      createdAtDate ? createdAtDate.toLocaleString() : "—",
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-sky-200">{t("orders.totalLabel")}</p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    {new Intl.NumberFormat("fr-DZ").format(order.total)} DZD
                  </p>
                </div>
              </div>
            </section>

            {/* Items list */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-white mb-4">{t("orders.itemsTitle")}</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={item.variantKey || index}
                      className="flex gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0"
                    >
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        unoptimized
                        className="object-cover"
                        priority={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white">{item.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-sky-200 mt-1">
                        <ColorDot hex={colorCodeToHex(item.colorCode)} size="sm" />
                        <span>{item.size}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-sky-100">
                          {t("orders.quantityLabel")}: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {new Intl.NumberFormat("fr-DZ").format(item.price * item.quantity)} {item.currency}
                        </p>
                      </div>
                      <p className="text-xs text-sky-300 mt-1">
                        {new Intl.NumberFormat("fr-DZ").format(item.price)} {item.currency} {t("orders.eachLabel")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Customer info */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-white mb-4">{t("orders.customerInfoTitle")}</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.editModalNameLabel")}</dt>
                  <dd className="text-sm font-medium text-white mt-1">{order.shipping.customerName}</dd>
                </div>
                {order.customerEmail && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("checkout.emailLabel")}</dt>
                    <dd className="text-sm text-sky-100 mt-1">{order.customerEmail}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.editModalPhoneLabel")}</dt>
                  <dd className="text-sm text-sky-100 mt-1">{order.shipping.phone}</dd>
                </div>
              </dl>
            </section>

            {/* Shipping info */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-white mb-4">{t("orders.shippingInfoTitle")}</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.editModalWilayaLabel")}</dt>
                  <dd className="text-sm font-medium text-white mt-1">{order.shipping.wilaya}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.editModalAddressLabel")}</dt>
                  <dd className="text-sm text-sky-100 mt-1 whitespace-pre-wrap">{order.shipping.address}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.deliveryModeLabel")}</dt>
                  <dd className="text-sm text-sky-100 mt-1">
                    {order.shipping.mode === "home" ? t("delivery.home") : t("delivery.desk")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">{t("orders.shippingCostLabel")}</dt>
                  <dd className="text-sm font-semibold text-white mt-1">
                    {new Intl.NumberFormat("fr-DZ").format(order.shippingCost)} DZD
                  </dd>
                </div>
              </dl>
            </section>

            {/* Notes */}
            {order.notes && (
              <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
                <h2 className="text-lg font-semibold text-white mb-4">{t("orders.notesLabel")}</h2>
                <p className="text-sm text-sky-100 whitespace-pre-wrap">{order.notes}</p>
              </section>
            )}

            {/* Cancel order */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-white">{t("orders.cancelOrderTitle")}</h2>
                  {order.status === "pending" && (
                    <p className="text-sm text-sky-100">
                      {t("orders.cancelPendingNote")}
                    </p>
                  )}
                  {order.status === "cancelled" && (
                    <p className="text-sm text-rose-100">{t("orders.cancelledNote")}</p>
                  )}
                  {order.status !== "pending" && order.status !== "cancelled" && (
                    <p className="text-sm text-sky-100">{t("orders.cannotCancelNote")}</p>
                  )}
                  {cancelError && (
                    <div className="mt-2 rounded-xl border border-rose-200/50 bg-rose-500/20 px-3 py-2 text-sm text-rose-50">
                      {cancelError}
                    </div>
                  )}
                </div>
                {order.status === "pending" && (
                  <div className="w-full max-w-xs text-right">
                    {!showCancelConfirm ? (
                      <button
                        onClick={() => {
                          setShowCancelConfirm(true);
                          setToastMessage(null);
                          setCancelError(null);
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("orders.cancelOrderButton")}
                      </button>
                    ) : (
                      <div className="space-y-3 text-right">
                        <p className="text-sm text-rose-100">{t("orders.cancelConfirmPrompt")}</p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button
                            onClick={handleCancelOrder}
                            disabled={isCancelling}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200/50 bg-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isCancelling ? t("orders.cancelConfirming") : t("orders.cancelConfirmYes")}
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={isCancelling}
                            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t("orders.keepOrder")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Edit order */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">{t("orders.editOrderSectionTitle")}</h2>
                {order.status === "pending" && (
                  <p className="text-sm text-sky-100">
                    {t("orders.editOrderPendingNote")}
                  </p>
                )}
                {order.status !== "pending" && (
                  <p className="text-sm text-sky-100">{t("orders.editOrderLockedNote")}</p>
                )}
                {editError && (
                  <div className="mt-2 rounded-xl border border-rose-200/50 bg-rose-500/20 px-3 py-2 text-sm text-rose-50">
                    {editError}
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Sidebar - Order summary */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold text-white mb-4">{t("orders.orderSummaryTitle")}</h2>
              <dl className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-sky-100">{t("orders.editModalSubtotalLabel")}</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(order.subtotal)} DZD
                  </dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-sky-100">{t("orders.editModalShippingLabel")}</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(order.shippingCost)} DZD
                  </dd>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <dt className="text-base font-semibold text-white">{t("orders.totalLabel")}</dt>
                  <dd className="text-lg font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(order.total)} DZD
                  </dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-sky-200">
                  {t("orders.paymentMethodLabel")}{" "}
                  <span className="font-semibold text-white">{t("payment.codWithAbbrev")}</span>
                </p>
              </div>
            </section>

            <Link
              href={localizePathname(locale, "/orders")}
              className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {t("orders.backToOrders")}
            </Link>
          </aside>
        </div>
      </main>

      <EditOrderModal
        order={order}
        open={showEditModal}
        currentUser={user}
        onClose={() => setShowEditModal(false)}
        onUpdated={handleOrderUpdated}
        onError={(message) => setEditError(message || null)}
      />
    </PageShell>
  );
}
