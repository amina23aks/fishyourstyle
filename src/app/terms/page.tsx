import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Fish Your Style",
  description: "Review the terms for shopping with Fish Your Style.",
};

export default function TermsPage() {
  const currentYear = 2025;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 text-slate-100">
      <div className="space-y-8 rounded-2xl bg-slate-950/60 p-8 shadow-xl shadow-slate-900/30">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Terms &amp; Conditions</h1>
          <p className="text-sm text-slate-300">Last updated: {currentYear}</p>
        </header>

        <div className="space-y-6 text-sm leading-6 text-slate-200">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">About Fish Your Style</h2>
            <p>
              Fish Your Style is a streetwear brand inspired by the sea. We aim
              to deliver comfortable, stylish clothing made with care for our
              community.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Orders &amp; Confirmation</h2>
            <p>
              After placing an order, you will receive a confirmation
              notification. A member of our team will personally call you to
              confirm your order before processing and shipping. If we are
              unable to reach you, your order may be delayed or cancelled.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Prices &amp; Payment</h2>
            <p>
              Prices are shown in local currency. We currently accept cash on
              delivery. Please ensure payment is available at the time of
              delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Shipping &amp; Delivery</h2>
            <p>
              Delivery time depends on your location. We always work to deliver
              as quickly as possible and will inform you if any delays occur.
              Orders are shipped after phone confirmation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Returns &amp; Exchanges</h2>
            <p>
              If something is not right with your order, please contact us
              within 7 days of receiving your item. We will review your request
              and provide an exchange or refund when appropriate.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Changes to Terms</h2>
            <p>
              We may update these terms occasionally. Any new version will be
              posted here with an updated date.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Contact</h2>
            <p>
              For questions or assistance, please visit the Contact page on our
              website.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
