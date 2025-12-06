import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersList from "@/components/OrdersList";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Orders | Fish Your Style",
  description: "Review orders placed through the Fish Your Style checkout.",
};

function OrdersListFallback() {
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

export default function OrdersPage() {
  return (
    <PageShell>
      <main className="space-y-6 lg:space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Orders</p>
          <h1 className="text-3xl font-semibold text-white">Order history</h1>
          <p className="max-w-2xl text-sm text-sky-100">
            View all your orders placed through the checkout. Orders are saved to Firestore and persist across sessions.
          </p>
        </header>

        <Suspense fallback={<OrdersListFallback />}>
          <OrdersList />
        </Suspense>
      </main>
    </PageShell>
  );
}
