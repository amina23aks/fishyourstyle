"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import type { Order } from "@/types/order";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );

    if (!confirmed || !order) return;

    setIsCancelling(true);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id, action: "cancel" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to cancel order");
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      alert(`Error cancelling order: ${errorMessage}`);
      console.error("Failed to cancel order:", err);
    } finally {
      setIsCancelling(false);
    }
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
            <p className="text-sm mb-6">{error || "The order you're looking for doesn't exist."}</p>
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

  const isPending = order.status === "pending";

  return (
    <PageShell>
      <main className="space-y-6 lg:space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Order Details</p>
          <h1 className="text-3xl font-semibold text-white">Order #{order.id.slice(-8)}</h1>
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

            {/* Cancel button - only for pending orders */}
            {isPending && (
              <section className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm shadow-sky-900/30 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">Cancel Order</h3>
                    <p className="text-sm text-sky-200 mt-1">
                      You can cancel this order as long as it&apos;s pending.
                    </p>
                  </div>
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="rounded-lg border border-rose-200/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Order"}
                  </button>
                </div>
              </section>
            )}
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
    </PageShell>
  );
}
