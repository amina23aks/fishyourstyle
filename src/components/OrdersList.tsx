"use client";

import { useEffect, useState } from "react";
import { getOrders, type Order } from "@/lib/orders";

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-slate-600">
        <p>No orders yet. Complete checkout to see them appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {[...orders]
        .reverse()
        .map((order) => (
          <article
            key={order.id}
            className="rounded-2xl border border-sky-100 bg-white/70 p-5 shadow-sm shadow-sky-100/60"
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-sky-700">Order</p>
                <h3 className="text-lg font-semibold text-slate-900">{order.itemsSummary}</h3>
              </div>
              <div className="text-right text-slate-700">
                <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="text-base font-semibold text-slate-900">{order.total.toFixed(2)} DZD</p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Customer</dt>
                <dd className="text-sm font-medium text-slate-900">{order.customerName}</dd>
                <dd className="text-sm text-slate-600">{order.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Notes</dt>
                <dd className="text-sm text-slate-700">
                  {order.notes || "—"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
    </div>
  );
}
