"use client";

import { useEffect, useState } from "react";
import { getOrders } from "@/lib/orders";
import type { Order } from "@/types/order";

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-6 text-sky-100">
        <p>No orders yet. Complete checkout to see them appear here.</p>
      </div>
    );
  }

  // Helper to generate items summary string from order items
  const getItemsSummary = (order: Order): string => {
    if (order.items.length === 0) return "Empty order";
    if (order.items.length === 1) {
      const item = order.items[0];
      return `${item.name} (${item.colorName}, ${item.size}) × ${item.quantity}`;
    }
    return `${order.items.length} items`;
  };

  return (
    <div className="grid gap-4">
      {[...orders]
        .reverse()
        .map((order) => (
          <article
            key={order.id}
            className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sky-50 shadow-sm shadow-sky-900/30 backdrop-blur"
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-sky-200">Order #{order.id.slice(-8)}</p>
                <h3 className="text-lg font-semibold text-white">{getItemsSummary(order)}</h3>
                <p className="text-xs text-sky-300 mt-1">
                  Status: <span className="font-semibold text-white">{order.status}</span>
                </p>
              </div>
              <div className="text-right text-sky-100">
                <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="text-base font-semibold text-white">{order.total.toFixed(2)} DZD</p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Customer</dt>
                <dd className="text-sm font-medium text-white">{order.shipping.customerName}</dd>
                <dd className="text-sm text-sky-100">{order.customerEmail}</dd>
                <dd className="text-sm text-sky-200">{order.shipping.phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Shipping</dt>
                <dd className="text-sm text-sky-100">{order.shipping.wilaya}</dd>
                <dd className="text-sm text-sky-200">
                  {order.shipping.mode === "home" ? "À domicile" : "Stop Desk"} - {order.shippingCost} DZD
                </dd>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <dt className="text-xs uppercase tracking-[0.18em] text-sky-300">Notes</dt>
                  <dd className="text-sm text-sky-100 mt-1">{order.notes}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
    </div>
  );
}
