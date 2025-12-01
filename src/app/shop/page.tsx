import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Shop | Fish Your Style",
  description: "Browse the latest Fish Your Style drops and sea-inspired fits.",
};

export default function ShopPage() {
  return (
    <PageShell>
      <section className="w-full space-y-4 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Shop</p>
          <h1 className="text-3xl font-semibold text-white">Collections amina</h1>
          <p className="max-w-2xl text-sky-100">
            Product cards will live here once Firestore is connected. For now this
            page validates routing and layout, so we can plug data in next.
          </p>
        </div>
        <div className="grid gap-4 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sky-100">
          <p>🧭 Ready for product grid, filters, and quick views.</p>
          <p>🔗 Dynamic route /shop/[id] will follow to show product details.</p>
        </div>
      </section>
    </PageShell>
  );
}
