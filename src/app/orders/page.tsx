import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersList from "@/components/OrdersList";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Orders | Fish Your Style",
  description: "Track your deliveries and review the details of orders placed through Fish Your Style.",
};

export default function OrdersPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl space-y-6 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-sky-50">Order History</h1>
          <p className="text-sky-100/80">
            Track your deliveries and review the details of orders placed through Fish Your Style.
          </p>
        </header>

        <Suspense fallback={<div className="rounded-2xl bg-white/5 p-6 text-sky-100">Loading your orders…</div>}>
          <OrdersList />
        </Suspense>
      </section>
    </PageShell>
  );
}
