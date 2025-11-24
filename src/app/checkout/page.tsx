import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Fish Your Style",
  description: "Complete your Fish Your Style order securely.",
};

export default function CheckoutPage() {
  return (
    <section className="w-full space-y-4">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Checkout</p>
        <h1 className="text-3xl font-semibold text-slate-900">Secure checkout</h1>
        <p className="max-w-2xl text-slate-600">
          This page will host the form for customer info, shipping, and order
          totals. We will connect it to Firestore orders after the cart system is
          live.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-slate-600">
        <p>🧾 Form fields, validation, and order submission plug in here.</p>
      </div>
    </section>
  );
}
