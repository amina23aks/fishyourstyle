import type { Metadata } from "next";
import OrdersList from "@/components/OrdersList";

export const metadata: Metadata = {
  title: "Orders | Fish Your Style",
  description: "Review orders placed through the Fish Your Style checkout.",
};

export default function OrdersPage() {
  return (
    <section className="w-full space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Orders</p>
        <h1 className="text-3xl font-semibold text-slate-900">Order history</h1>
        <p className="max-w-2xl text-slate-600">
          When a client completes checkout, the order is saved locally so you can
          see it here and verify details.
        </p>
      </div>

      <OrdersList />
    </section>
  );
}
