"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OrderStatusSelect } from "../components/OrderStatusSelect";
import { StatusBadge } from "../components/StatusBadge";
import { fetchOrderById, updateOrderStatus } from "@/lib/admin-orders";
import type { Order, OrderStatus } from "@/types/order";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Toast = { id: number; type: "success" | "error"; message: string };

type Props = { params: Promise<{ id: string }> };

export default function AdminOrderDetailPage({ params }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve(params)
      .then((resolved) => {
        if (!active) return;
        setOrderId(resolved.id);
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Failed to read route params";
        setError(message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetched = await fetchOrderById(orderId);
        if (!fetched) {
          setError("Order not found");
        }
        setOrder(fetched);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load order";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      if (!order || order.status === nextStatus) return;

      const previousStatus = order.status;
      const previousUpdatedAt = order.updatedAt;
      const updatedAt = new Date().toISOString();

      setStatusUpdating(orderId);
      setOrder({ ...order, status: nextStatus, updatedAt });

      try {
        await updateOrderStatus(orderId, nextStatus);
        pushToast({ type: "success", message: "Order status updated" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update status";
        pushToast({ type: "error", message });
        setOrder({ ...order, status: previousStatus, updatedAt: previousUpdatedAt });
      } finally {
        setStatusUpdating(null);
      }
    },
    [order, pushToast]
  );

  const currentStatus = useMemo(() => order?.status, [order?.status]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-10">
      <div className="space-y-1">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:text-white"
        >
          ← Orders
        </Link>
        <h1 className="text-2xl font-semibold text-white">Order details</h1>
        <p className="max-w-2xl text-sm text-sky-100/85">
          Full record for this order with status controls, payment summary, items, and shipping information.
        </p>
      </div>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-6 text-center text-sky-100/85 shadow-2xl shadow-sky-900/50">
          <p className="text-lg font-semibold text-white">Unable to load order</p>
          <p className="text-sm">{error}</p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-inner shadow-sky-900/30 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Back to orders
          </Link>
        </div>
      ) : order ? (
        <div className="space-y-5">
          <section className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-sky-900/50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Order</p>
                <h2 className="text-2xl font-semibold text-white">{order.id.slice(0, 8)}…</h2>
                <p className="text-sm text-sky-100/80">Placed {formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {currentStatus ? <StatusBadge status={currentStatus} /> : null}
                {currentStatus ? (
                  <OrderStatusSelect
                    value={currentStatus}
                    onChange={(status) => handleStatusChange(order.id, status)}
                    disabled={statusUpdating === order.id}
                    label="Status"
                  />
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-inner shadow-sky-900/40">
              <div className="flex items-center justify-between text-sm text-sky-100/80">
                <h3 className="text-lg font-semibold text-white">Order Summary</h3>
                <span>Updated {formatDateTime(order.updatedAt)}</span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-sky-100/85 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Subtotal</p>
                  <p className="text-white">{formatCurrency(order.subtotal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Shipping</p>
                  <p className="text-white">{formatCurrency(order.shippingCost)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Payment</p>
                  <p className="text-white">{order.paymentMethod}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Total</p>
                  <p className="text-xl font-semibold text-white">{formatCurrency(order.total)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-inner shadow-sky-900/40">
              <h3 className="text-lg font-semibold text-white">Shipping details</h3>
              <div className="grid grid-cols-1 gap-3 text-sm text-sky-100/85 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Customer</p>
                  <p className="text-white">{order.shipping.customerName || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Phone</p>
                  <p className="text-white">{order.shipping.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Wilaya</p>
                  <p className="text-white">{order.shipping.wilaya || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Address</p>
                  <p className="text-white">{order.shipping.address || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Mode</p>
                  <p className="text-white">{order.shipping.mode}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Email</p>
                  <p className="text-white">{order.customerEmail || "Guest checkout"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-inner shadow-sky-900/40">
            <h3 className="text-lg font-semibold text-white">Items</h3>
            <div className="divide-y divide-white/5">
              {order.items.map((item) => (
                <div key={item.variantKey} className="flex flex-col gap-2 py-3 text-sm text-sky-100/85">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-sky-100/70">{item.colorName} · {item.size}</p>
                    </div>
                    <p className="font-semibold text-white">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-xs text-sky-100/70">
                    <span>Qty: {item.quantity}</span>
                    <span>Line total: {formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl shadow-sky-900/40 backdrop-blur ${
              toast.type === "success"
                ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-300/40"
                : "bg-rose-500/15 text-rose-50 ring-1 ring-rose-300/40"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 rounded-3xl border border-white/10 bg-white/5" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-48 rounded-3xl border border-white/10 bg-white/5" />
        <div className="h-48 rounded-3xl border border-white/10 bg-white/5" />
      </div>
      <div className="h-64 rounded-3xl border border-white/10 bg-white/5" />
    </div>
  );
}
