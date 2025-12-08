"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OrderStatusSelect } from "./components/OrderStatusSelect";
import { StatusBadge } from "./components/StatusBadge";
import { STATUS_FILTER_OPTIONS, statusStyles } from "./statusConfig";
import { fetchRecentOrders, updateOrderStatus } from "@/lib/admin-orders";
import type { Order, OrderStatus } from "@/types/order";

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

type Toast = { id: number; type: "success" | "error"; message: string };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]>("all");
  const [search, setSearch] = useState("");
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recentOrders = await fetchRecentOrders(25);
      setOrders(recentOrders);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch orders";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      const matchesSearch = trimmed
        ? order.id.toLowerCase().includes(trimmed) || (order.customerEmail ?? "").toLowerCase().includes(trimmed)
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      const currentOrder = orders.find((order) => order.id === orderId);
      if (!currentOrder || currentOrder.status === nextStatus) return;

      const previousStatus = currentOrder.status;
      const previousUpdatedAt = currentOrder.updatedAt;
      const updatedAt = new Date().toISOString();

      setStatusUpdating(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus, updatedAt } : order
        )
      );
      try {
        await updateOrderStatus(orderId, nextStatus);
        pushToast({ type: "success", message: "Order status updated" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update status";
        pushToast({ type: "error", message });
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: previousStatus, updatedAt: previousUpdatedAt }
              : order
          )
        );
      } finally {
        setStatusUpdating(null);
      }
    },
    [orders, pushToast]
  );

  const isEmpty = !loading && !error && filteredOrders.length === 0;

  return (
    <div className="relative space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Orders</p>
        <h1 className="text-2xl font-semibold text-white">Orders</h1>
        <p className="max-w-2xl text-sm text-sky-100/85">
          Review recent checkouts, monitor statuses, and keep an eye on fulfilment. Quickly adjust order states from the
          list or open full details when needed.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900/40 ${
                statusFilter === status
                  ? "bg-white/20 text-white ring-1 ring-white/50 shadow shadow-sky-900/40"
                  : "bg-white/10 text-sky-100 hover:bg-white/15"
              }`}
            >
              {status === "all" ? "All" : statusStyles[status].label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 lg:w-auto">
          <div className="w-full min-w-[240px] max-w-sm sm:w-auto">
            <label className="relative block">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID or email"
                className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-sky-100/60 shadow-inner shadow-sky-900/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sky-100/70">⌕</span>
            </label>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-sky-900/50 backdrop-blur">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-sky-100/80">
            <span>
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">
              Recent {orders.length}
            </span>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">Unable to load orders</p>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow shadow-sky-900/40 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <OrderTableSkeleton />
        ) : isEmpty ? (
          <div className="px-6 py-12 text-center text-sky-100/85">
            <p className="text-lg font-semibold text-white">No orders yet</p>
            <p className="mt-2 text-sm">
              Once customers complete checkout, their orders will appear here for review and future management.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm text-sky-100/85">
                <thead className="sticky top-0 z-10 bg-slate-950/70 backdrop-blur">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Order</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Customer</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Wilaya</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-sky-200">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer transition hover:bg-white/5"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <td className="px-6 py-4 align-top font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100/80">Order</span>
                          <span className="font-mono text-sm">{order.id.slice(0, 8)}…</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sky-100/80">{formatDateTime(order.createdAt)}</td>
                      <td className="px-6 py-4 align-top text-sky-100/90">
                        <div className="font-semibold text-white">{order.shipping.customerName || "Unknown"}</div>
                        <div className="text-xs text-sky-100/70">{order.customerEmail || "Guest checkout"}</div>
                      </td>
                      <td className="px-6 py-4 align-top text-sky-100/80">{order.shipping.wilaya || "—"}</td>
                      <td className="px-6 py-4 align-top">
                        <OrderStatusSelect
                          value={order.status}
                          onChange={(status) => handleStatusChange(order.id, status)}
                          disabled={statusUpdating === order.id}
                          label="Status"
                        />
                      </td>
                      <td className="px-6 py-4 align-top text-right font-semibold text-white">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 px-4 pb-6 md:hidden">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/admin/orders/${order.id}`);
                    }
                  }}
                  className="space-y-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sky-50 shadow-inner shadow-sky-900/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-sky-100/70">
                        <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">Order</span>
                        <span className="font-mono">{order.id.slice(0, 8)}…</span>
                      </div>
                      <div className="text-sm text-sky-100/80">{formatDateTime(order.createdAt)}</div>
                      <div className="text-base font-semibold text-white">
                        {order.shipping.customerName || "Unknown"}
                      </div>
                      <div className="text-xs text-sky-100/70">{order.customerEmail || "Guest checkout"}</div>
                    </div>
                    <div className="text-right font-semibold text-white">{formatCurrency(order.total)}</div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-sky-100/80">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Wilaya</p>
                      <p className="font-semibold text-white">{order.shipping.wilaya || "—"}</p>
                    </div>
                    <OrderStatusSelect
                      value={order.status}
                      onChange={(status) => handleStatusChange(order.id, status)}
                      disabled={statusUpdating === order.id}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
            </>
        )}
      </div>

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

function OrderTableSkeleton() {
  return (
      <div className="divide-y divide-white/5">
        <div className="grid grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-sky-200">
          <span>Order</span>
          <span>Date</span>
          <span>Customer</span>
          <span>Wilaya</span>
          <span>Status</span>
          <span className="text-right">Total</span>
        </div>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 px-6 py-4">
            {[...Array(6)].map((__, colIndex) => (
              <span
                key={colIndex}
                className="h-4 rounded-full bg-white/10 animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
  );
}
