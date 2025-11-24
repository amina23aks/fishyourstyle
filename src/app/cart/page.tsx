import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart | Fish Your Style",
  description: "Review the items in your sea-inspired cart.",
};

export default function CartPage() {
  return (
    <section className="w-full space-y-4">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Cart</p>
        <h1 className="text-3xl font-semibold text-slate-900">Your cart</h1>
        <p className="max-w-2xl text-slate-600">
          Cart logic will be powered by context + localStorage, then connected to
          checkout. This placeholder keeps navigation working while we build the
          data layer.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-slate-600">
        <p>🎣 Hook this up to CartContext to list products, quantities, and totals.</p>
      </div>
    </section>
  );
}
