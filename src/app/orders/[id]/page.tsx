"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import type { Order, OrderItem, ShippingInfo } from "@/types/order";

type EditOrderModalProps = {
  order: Order;
  open: boolean;
  onClose: () => void;
  onUpdated: (updatedOrder: Order) => void;
  onError: (message: string) => void;
};

function EditOrderModal({ order, open, onClose, onUpdated, onError }: EditOrderModalProps) {
  const [shipping, setShipping] = useState<ShippingInfo>(order.shipping);
  const [notes, setNotes] = useState<string>(order.notes ?? "");
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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

  const disabled = order.status !== "pending";

  const updateItemQuantity = (index: number, delta: number) => {
    setItems((current) =>
      current.map((item, idx) =>
        idx === index
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + delta),
            }
          : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (disabled) {
      setLocalError("Order can no longer be edited.");
      return;
    }

    if (items.length === 0) {
      setLocalError("Order must contain at least one item.");
      return;
    }

    setIsSaving(true);
    setLocalError(null);
    onError("");

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipping,
          notes,
          items,
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
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setLocalError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 md:py-14">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur" onClick={onClose} />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Edit Order</p>
            <h3 className="text-xl font-semibold text-white">Order #{order.id.slice(-8)}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Close
          </button>
        </div>

        {disabled && (
          <div className="border-b border-white/10 bg-rose-500/15 px-6 py-3 text-sm text-rose-50">
            Order can no longer be edited.
          </div>
        )}

        <div className="grid max-h-[75vh] gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">Shipping</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  Name
                  <input
                    value={shipping.customerName}
                    onChange={(e) => setShipping({ ...shipping, customerName: e.target.value })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    type="text"
                  />
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  Phone
                  <input
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    type="tel"
                  />
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  Wilaya
                  <input
                    value={shipping.wilaya}
                    onChange={(e) => setShipping({ ...shipping, wilaya: e.target.value })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    type="text"
                  />
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1">
                  Address
                  <input
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    type="text"
                  />
                </label>
                <label className="flex flex-col text-sm text-sky-100 gap-1 md:col-span-2">
                  Delivery mode
                  <select
                    value={shipping.mode}
                    onChange={(e) => setShipping({ ...shipping, mode: e.target.value as ShippingInfo["mode"] })}
                    disabled={disabled}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60 bg-slate-900/40"
                  >
                    <option value="home">À domicile</option>
                    <option value="desk">Stop Desk</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">Notes</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={disabled}
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
              />
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">Items</h4>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.variantKey || index}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs text-sky-200">
                        {item.colorName} · {item.size}
                      </p>
                      <p className="text-xs text-sky-100 mt-1">
                        {new Intl.NumberFormat("fr-DZ").format(item.price)} {item.currency} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(index, -1)}
                        disabled={disabled || item.quantity <= 1}
                        className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(index, 1)}
                        disabled={disabled}
                        className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      disabled={disabled}
                      className="text-xs font-semibold text-rose-200 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-sky-200">Add at least one item to keep this order.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm shadow-sky-900/30">
              <h4 className="text-sm font-semibold text-white mb-3">Summary</h4>
              <dl className="space-y-2 text-sm text-sky-100">
                <div className="flex items-center justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(subtotal)} DZD
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(shippingCost)} DZD
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-base">
                  <dt className="font-semibold text-white">Total</dt>
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
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || disabled}
                className="inline-flex items-center justify-center rounded-xl border border-violet-200/40 bg-violet-500/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

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
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Order not found");
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to fetch order");
          }
          return;
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Failed to fetch order:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || "Failed to cancel order";
        const friendlyMessage =
          message === "Only pending orders can be cancelled."
            ? "This order is no longer pending and cannot be cancelled."
            : message;
        throw new Error(friendlyMessage);
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setToastMessage("Order cancelled successfully.");
      setShowCancelConfirm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setCancelError(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOrderUpdated = (updated: Order) => {
    setOrder(updated);
    setToastMessage("Order updated successfully.");
    setEditError(null);
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
            <p className="font-medium text-lg mb-2">Order not found</p>
            <p className="text-sm mb-6">{error || "The order you are looking for does not exist."}</p>
            <Link
              href="/orders"
              className="inline-flex items-center rounded-lg border border-rose-200/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
            >
              Back to orders
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  const canCancel = order.status === "pending";
  const canEdit = order.status === "pending";

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
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Order Details</p>
              <h1 className="text-3xl font-semibold text-white">Order #{order.id.slice(-8)}</h1>
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
                Edit order
              </button>
            )}
          </div>
          {!canEdit && (
            <p className="text-sm text-sky-200">This order can no longer be modified.</p>
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
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  <p className="text-sm text-sky-200">
                    Placed on {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-sky-200">Total</p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    {new Intl.NumberFormat("fr-DZ").format(order.total)} DZD
                  </p>
                </div>
              </div>
            </section>

            {/* Items list */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
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
                      <p className="text-sm text-sky-200 mt-1">
                        {item.colorName} · {item.size}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-sky-100">Quantity: {item.quantity}</p>
                        <p className="text-sm font-semibold text-white">
                          {new Intl.NumberFormat("fr-DZ").format(item.price * item.quantity)} {item.currency}
                        </p>
                      </div>
                      <p className="text-xs text-sky-300 mt-1">
                        {new Intl.NumberFormat("fr-DZ").format(item.price)} {item.currency} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Customer info */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Name</dt>
                  <dd className="text-sm font-medium text-white mt-1">{order.shipping.customerName}</dd>
                </div>
                {order.customerEmail && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Email</dt>
                    <dd className="text-sm text-sky-100 mt-1">{order.customerEmail}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Phone</dt>
                  <dd className="text-sm text-sky-100 mt-1">{order.shipping.phone}</dd>
                </div>
              </dl>
            </section>

            {/* Shipping info */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <h2 className="text-lg font-semibold text-white mb-4">Shipping Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Wilaya</dt>
                  <dd className="text-sm font-medium text-white mt-1">{order.shipping.wilaya}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Address</dt>
                  <dd className="text-sm text-sky-100 mt-1 whitespace-pre-wrap">{order.shipping.address}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Delivery Mode</dt>
                  <dd className="text-sm text-sky-100 mt-1">
                    {order.shipping.mode === "home" ? "À domicile" : "Stop Desk"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Shipping Cost</dt>
                  <dd className="text-sm font-semibold text-white mt-1">
                    {new Intl.NumberFormat("fr-DZ").format(order.shippingCost)} DZD
                  </dd>
                </div>
              </dl>
            </section>

            {/* Notes */}
            {order.notes && (
              <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
                <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
                <p className="text-sm text-sky-100 whitespace-pre-wrap">{order.notes}</p>
              </section>
            )}

            {/* Cancel order */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-white">Cancel Order</h2>
                  {order.status === "pending" && (
                    <p className="text-sm text-sky-100">
                      You can cancel this order as long as it is pending.
                    </p>
                  )}
                  {order.status === "cancelled" && (
                    <p className="text-sm text-rose-100">This order has been cancelled.</p>
                  )}
                  {order.status !== "pending" && order.status !== "cancelled" && (
                    <p className="text-sm text-sky-100">This order can no longer be cancelled.</p>
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
                        Cancel order
                      </button>
                    ) : (
                      <div className="space-y-3 text-right">
                        <p className="text-sm text-rose-100">Are you sure? This cannot be undone.</p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button
                            onClick={handleCancelOrder}
                            disabled={isCancelling}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200/50 bg-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isCancelling ? "Cancelling..." : "Yes, cancel order"}
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={isCancelling}
                            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Keep order
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
                <h2 className="text-lg font-semibold text-white">Edit Order</h2>
                {order.status === "pending" && (
                  <p className="text-sm text-sky-100">
                    You can update your shipping info, notes, or items before the order is confirmed. Use the Edit Order button at the top of the page to make changes.
                  </p>
                )}
                {order.status !== "pending" && (
                  <p className="text-sm text-sky-100">This order can no longer be modified.</p>
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
              <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
              <dl className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-sky-100">Subtotal</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(order.subtotal)} DZD
                  </dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-sky-100">Shipping</dt>
                  <dd className="font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(order.shippingCost)} DZD
                  </dd>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <dt className="text-base font-semibold text-white">Total</dt>
                  <dd className="text-lg font-semibold text-white">
                    {new Intl.NumberFormat("fr-DZ").format(order.total)} DZD
                  </dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-sky-200">
                  Payment method: <span className="font-semibold text-white">Cash on Delivery (COD)</span>
                </p>
              </div>
            </section>

            <Link
              href="/orders"
              className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Back to orders
            </Link>
          </aside>
        </div>
      </main>

      <EditOrderModal
        order={order}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdated={handleOrderUpdated}
        onError={(message) => setEditError(message || null)}
      />
    </PageShell>
  );
}
