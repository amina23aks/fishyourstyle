"use client";

import { useMemo } from "react";

import { StatusBadge } from "./components/StatusBadge";
import { OrderStatusSelect } from "./components/OrderStatusSelect";
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

export function AdminOrderDrawer({
  order,
  onClose,
  onStatusChange,
  statusUpdating,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  statusUpdating: string | null;
}) {
  const currentStatus = useMemo(() => order.status, [order.status]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-sky-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-50 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-white/10 bg-slate-950/80 text-sky-50 shadow-2xl shadow-sky-900/60 backdrop-blur-xl lg:max-w-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Order</p>
            <h2 className="text-2xl font-semibold text-white">{order.id.slice(0, 8)}…</h2>
            <p className="text-sm text-sky-100/80">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white shadow shadow-sky-900/40 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="space-y-2">
              <StatusBadge status={order.status} />
              <div className="text-xs uppercase tracking-[0.2em] text-sky-200">Status</div>
            </div>
            <OrderStatusSelect
              value={currentStatus}
              onChange={(status) => onStatusChange(order.id, status)}
              disabled={statusUpdating === order.id}
              label="Update"
            />
          </div>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-sky-900/40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Order Summary</h3>
              <span className="text-sm text-sky-100/80">Updated {formatDateTime(order.updatedAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-sky-100/85">
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
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-sky-900/40">
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
                  <div className="flex items-center justify-between text-xs text-sky-100/70">
                    <span>Qty: {item.quantity}</span>
                    <span>Line total: {formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-sky-900/40">
            <h3 className="text-lg font-semibold text-white">Shipping details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-sky-100/85">
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
          </section>
        </div>
      </div>
    </div>
  );
}
