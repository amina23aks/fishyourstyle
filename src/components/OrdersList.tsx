"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { Order } from "@/types/order";

export default function OrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const successOrderId = searchParams.get("orderId");
  const isSuccess = searchParams.get("status") === "success" && successOrderId;

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );

    if (!confirmed) return;

    setCancellingOrderId(orderId);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, action: "cancel" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to cancel order");
      }

      // Refresh orders list
      await fetchOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      alert(`Error cancelling order: ${errorMessage}`);
      console.error("Failed to cancel order:", err);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleCardClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  // Helper to generate items summary string from order items
  const getItemsSummary = (order: Order): string => {
    if (order.items.length === 0) return "Empty order";
    if (order.items.length === 1) {
      const item = order.items[0];
      return `${item.name} (${item.colorName}, ${item.size}) × ${item.quantity}`;
    }
    return `${order.items.length} items`;
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
    <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm shadow-sky-900/30 backdrop-blur animate-pulse"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/10 rounded w-24"></div>
                <div className="h-6 bg-white/10 rounded w-48"></div>
                <div className="h-4 bg-white/10 rounded w-32"></div>
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 bg-white/10 rounded w-32 ml-auto"></div>
                <div className="h-5 bg-white/10 rounded w-24 ml-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200/60 bg-rose-500/15 p-6 text-rose-50 shadow-inner shadow-rose-900/30">
        <p className="font-medium mb-2">Error loading orders</p>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="rounded-lg border border-rose-200/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-6 text-sky-100">
        <p>No orders yet. Complete checkout to see them appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success banner */}
      {isSuccess && successOrderId && (
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-500/15 px-4 py-3 text-emerald-50 shadow-inner shadow-emerald-900/30">
          <p className="font-medium">Order placed successfully!</p>
          <p className="text-sm mt-1">
            Order ID: <span className="font-mono font-semibold">{successOrderId.slice(-8)}</span>
          </p>
        </div>
      )}

      {/* Orders list */}
      <div className="grid gap-4">
        {orders.map((order) => {
          const firstItem = order.items[0];
          const isPending = order.status === "pending";
          const isCancelling = cancellingOrderId === order.id;

          return (
          <article
            key={order.id}
              onClick={() => handleCardClick(order.id)}
              className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sky-50 shadow-sm shadow-sky-900/30 backdrop-blur cursor-pointer transition hover:border-white/30 hover:bg-white/15 relative"
          >
              <div className="flex gap-4">
                {/* Product thumbnail */}
                {firstItem && (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <Image
                      src={firstItem.image}
                      alt={firstItem.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                <p className="text-sm uppercase tracking-[0.18em] text-sky-200">Order #{order.id.slice(-8)}</p>
                      <h3 className="text-lg font-semibold text-white mt-1">{getItemsSummary(order)}</h3>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sky-100 mt-2 md:mt-0">
                      <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                      <p className="text-base font-semibold text-white mt-1">
                        {new Intl.NumberFormat("fr-DZ").format(order.total)} DZD
                </p>
              </div>
            </div>

                  <dl className="mt-4 grid gap-3 md:grid-cols-2 border-t border-white/10 pt-4">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Customer</dt>
                      <dd className="text-sm font-medium text-white mt-1">{order.shipping.customerName}</dd>
                      {order.customerEmail && (
                        <dd className="text-sm text-sky-100 mt-0.5">{order.customerEmail}</dd>
                      )}
                      <dd className="text-sm text-sky-200 mt-0.5">{order.shipping.phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Shipping</dt>
                      <dd className="text-sm text-sky-100 mt-1">{order.shipping.wilaya}</dd>
                      <dd className="text-sm text-sky-200 mt-0.5">
                        {order.shipping.mode === "home" ? "À domicile" : "Stop Desk"} - {new Intl.NumberFormat("fr-DZ").format(order.shipping.price)} DZD
                </dd>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Notes</dt>
                  <dd className="text-sm text-sky-100 mt-1">{order.notes}</dd>
                </div>
              )}
            </dl>

                  {/* Cancel button - only for pending orders */}
                  {isPending && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={(e) => handleCancelOrder(order.id, e)}
                        disabled={isCancelling}
                        className="rounded-lg border border-rose-200/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel order"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}
