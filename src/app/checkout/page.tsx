import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Checkout | Fish Your Style",
  description: "Complete your Fish Your Style order securely.",
};

export default function CheckoutPage() {
  return (
    <PageShell>
      <section className="w-full space-y-4 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Checkout</p>
          <h1 className="text-3xl font-semibold text-white">Secure checkout</h1>
          <p className="max-w-2xl text-sky-100">
            Capture customer details and a quick order summary. When you place an
            order, we save it locally and route you to the order history page.
          </p>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/5 p-6 shadow-inner shadow-sky-900/30">
          <CheckoutForm />
        </div>
      </section>
    </PageShell>
  );
}
