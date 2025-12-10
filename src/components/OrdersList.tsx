"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Order } from "@/types/order";
import { useAuth } from "@/context/auth";
import { ColorDot } from "@/components/ColorDot";
import { colorCodeToHex } from "@/lib/colorUtils";

export default function OrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const successOrderId = searchParams.get("orderId");
  const statusParam = searchParams.get("status");
  const showSuccessBanner = statusParam === "success" && Boolean(successOrderId);

  const successBanner = useMemo(() => {
    if (!showSuccessBanner || !successOrderId) return null;

    return (
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-500/15 px-4 py-3 text-emerald-50 shadow-inner shadow-emerald-900/30">
        <p className="font-medium">Order placed successfully!</p>
        <p className="mt-1 text-sm">
          Your order ID is <span className="font-mono font-semibold">{successOrderId}</span>.
        </p>
      </div>
    );
  }, [showSuccessBanner, successOrderId]);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setIsLoadingOrders(false);
      return;
    }

    setIsLoadingOrders(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(user.uid)}`);
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
      setIsLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
      setIsLoadingOrders(false);
      setError(null);
    }
  }, [authLoading, fetchOrders, user]);

  const handleCardClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  // Helpers
  const getItemsSummary = (order: Order): string => {
    if (order.items.length === 0) return "Empty order";
    if (order.items.length === 1) {
      const item = order.items[0];
      return `${item.name} (${item.size}) × ${item.quantity}`;
    }
    return `${order.items.length} items`;
  };

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

  const renderLoadingSkeleton = () => (
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

  // --- UI STATES ---
  if (authLoading) {
    return (
      <div className="space-y-4">
        {successBanner}
        {renderLoadingSkeleton()}
      </div>
    );
  }

  // Guest
  if (!user) {
    return (
      <div className="space-y-6">
        {successBanner}
        <div className="flex justify-center">
          <div className="mt-2 w-full max-w-xl rounded-2xl border border-white/20 bg-white/10 p-6 text-center shadow-sm shadow-sky-900/30 backdrop-blur">
            <h2 className="mb-2 text-lg font-semibold text-white">Sign in to see your full order history.</h2>
            <p className="mb-4 text-sm text-sky-100">Guest orders are only visible using your confirmation email or your order ID.</p>
            <Link
              href="/account"
              className="inline-flex items-center rounded-lg border border-sky-200/40 bg-sky-500/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              Go to my account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for user orders
  if (isLoadingOrders) {
    return (
      <div className="space-y-4">
        {successBanner}
        {renderLoadingSkeleton()}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        {successBanner}
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
      </div>
    );
  }

  // Logged-in: Empty state
  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        {successBanner}
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-sky-50 shadow-sm shadow-sky-900/30 backdrop-blur">
          <p className="font-medium text-lg mb-2">You don’t have any orders yet.</p>
          <p className="text-sm text-sky-100 mb-2">Discover the latest drops and place your first order.</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center rounded-lg border border-sky-200/40 bg-sky-500/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  // Logged-in: Orders exists
  return (
    <div className="space-y-4">
      {successBanner}
      <div className="grid gap-4">
        {orders.map((order) => {
          const firstItem = order.items[0];
          const canCancel = order.status === "pending";
          const canEdit = order.status === "pending";
          return (
            <article
              key={order.id}
              onClick={() => handleCardClick(order.id)}
              className={`rounded-2xl border border-white/20 bg-white/10 p-5 text-sky-50 shadow-sm shadow-sky-900/30 backdrop-blur cursor-pointer transition hover:border-white/30 hover:bg-white/15 relative ${order.status === "cancelled" ? "opacity-75" : ""}`}
              data-can-cancel={canCancel}
              data-can-edit={canEdit}
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
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm uppercase tracking-[0.18em] text-sky-200">Order #{order.id.slice(-8)}</p>
                      <h3 className="text-lg font-semibold text-white mt-1">{getItemsSummary(order)}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {canEdit && (
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              router.push(`/orders/${order.id}?edit=true`);
                            }}
                            className="inline-flex items-center rounded-full border border-violet-200/40 bg-violet-500/60 px-3 py-1 text-xs font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sky-100 mt-2 md:mt-0">
                      <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                      <p className="text-base font-semibold text-white mt-1">
                        {new Intl.NumberFormat("en-US").format(order.total)} DZD
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
                        {order.shipping.mode === "home" ? "Home delivery" : "Stop Desk"} - {new Intl.NumberFormat("en-US").format(order.shipping.price)} DZD
                      </dd>
                    </div>
                    {order.notes && (
                      <div className="md:col-span-2">
                        <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Notes</dt>
                        <dd className="text-sm text-sky-100 mt-1">{order.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
