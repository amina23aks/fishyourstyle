import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Cart | Fish Your Style",
  description: "Review the items in your sea-inspired cart.",
};

export default function CartPage() {
  return (
    <PageShell>
      <section className="w-full space-y-4 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Cart</p>
          <h1 className="text-3xl font-semibold text-white">Your cart</h1>
          <p className="max-w-2xl text-sky-100">
            Cart logic will be powered by context + localStorage, then connected to
            checkout. This placeholder keeps navigation working while we build the
            data layer.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sky-100">
          <p>🎣 Hook this up to CartContext to list products, quantities, and totals.</p>
        </div>
      </section>
    </PageShell>
  );
}
