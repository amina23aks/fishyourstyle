import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop | Fish Your Style",
  description: "Browse the latest Fish Your Style drops and sea-inspired fits.",
};

export default function ShopPage() {
  return (
    <section className="w-full space-y-4">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Shop</p>
        <h1 className="text-3xl font-semibold text-slate-900">Collections</h1>
        <p className="max-w-2xl text-slate-600">
          Product cards will live here once Firestore is connected. For now this
          page validates routing and layout, so we can plug data in next.
        </p>
      </div>
      <div className="grid gap-4 rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-slate-600">
        <p>🧭 Ready for product grid, filters, and quick views.</p>
        <p>🔗 Dynamic route /shop/[id] will follow to show product details.</p>
      </div>
    </section>
  );
}
