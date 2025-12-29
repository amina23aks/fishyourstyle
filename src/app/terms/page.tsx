import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Fish Your Style",
  description: "Read the terms for shopping with Fish Your Style.",
};

export default function TermsPage() {
  const currentYear = new Date().getFullYear();

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
              Fish Your Style is a small streetwear brand inspired by the sea.
              Our goal is to deliver comfortable, ocean-ready fashion made with
              care for our community.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Orders &amp; confirmation</h2>
            <p>
              When you place an order, you will receive a confirmation message
              with the details. We may contact you if we need to verify
              information or clarify delivery preferences.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Prices &amp; payment</h2>
            <p>
              Prices are shown in the local currency. At the moment, we accept
              cash on delivery. Please make sure payment is available when your
              order arrives.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Shipping &amp; delivery</h2>
            <p>
              Delivery timelines depend on your location. We will do our best to
              ship quickly and keep you updated if any delays occur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Returns &amp; exchanges</h2>
            <p>
              If something is not right with your order, reach out within 7 days
              of delivery. We will review your request and offer an exchange or
              refund when reasonable.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Changes to the terms</h2>
            <p>
              We may update these terms from time to time. The latest version
              will always be posted here with a new update date.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Contact</h2>
            <p>
              Questions? Contact us at{" "}
              <span className="font-semibold text-white">support@fishyourstyle.com</span>.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
