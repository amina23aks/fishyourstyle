import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

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
          Capture customer details and a quick order summary. When you place an
          order, we save it locally and route you to the order history page.
        </p>
      </div>

      <div className="rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg shadow-sky-100/60">
        <CheckoutForm />
      </div>
    </section>
  );
}
