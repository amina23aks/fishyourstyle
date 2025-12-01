import type { Metadata } from "next";
import OrdersList from "@/components/OrdersList";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Orders | Fish Your Style",
  description: "Review orders placed through the Fish Your Style checkout.",
};

export default function OrdersPage() {
  return (
    <PageShell>
      <section className="w-full space-y-6 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Orders</p>
          <h1 className="text-3xl font-semibold text-white">Order history</h1>
          <p className="max-w-2xl text-sky-100">
            When a client completes checkout, the order is saved locally so you can
            see it here and verify details.
          </p>
        </div>

        <OrdersList />
      </section>
    </PageShell>
  );
}
