import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Returns | Fish Your Style",
  description: "Shipping and returns information for Fish Your Style orders.",
};

export default function ShippingPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 text-slate-100">
      <div className="space-y-8 rounded-2xl bg-slate-950/60 p-8 shadow-xl shadow-slate-900/30">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Shipping &amp; Returns</h1>
        </header>

        <div className="space-y-8 text-sm leading-6 text-slate-200">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Shipping Policy</h2>
            <p>
              Once your order is confirmed by phone, it will be prepared and
              shipped. Delivery time depends on your location and courier
              availability. We always work to deliver as fast and smoothly as
              possible.
            </p>
            <p>
              You will be contacted if any unexpected delays occur. Orders are
              delivered to the address provided during checkout, so please make
              sure your details are correct. If delivery fails due to incorrect
              information or customer unavailability, re-delivery may depend on
              courier policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Returns &amp; Exchanges Policy</h2>
            <p>
              If there is an issue with your order, you may request a return or
              exchange within 7 days of receiving your item. Products must be
              unused, in original condition, and with original packaging.
            </p>
            <p>
              If the item is damaged, defective, or incorrect, please contact
              us and we will assist you. Once the item is reviewed, we will
              provide an exchange or refund when applicable. Return approval
              may depend on product condition and situation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Need Help?</h2>
            <p>
              For assistance with shipping, returns, or any questions, please
              visit the Contact page on our website.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
