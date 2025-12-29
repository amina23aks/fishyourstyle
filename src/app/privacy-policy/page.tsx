import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Fish Your Style",
  description: "Learn how Fish Your Style collects and uses your information.",
};

export default function PrivacyPolicyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 text-slate-100">
      <div className="space-y-8 rounded-2xl bg-slate-950/60 p-8 shadow-xl shadow-slate-900/30">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-slate-300">Last updated: {currentYear}</p>
        </header>

        <div className="space-y-6 text-sm leading-6 text-slate-200">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">What we collect</h2>
            <p>
              When you create an account or place an order, we collect basic
              information such as your name, email address, phone number, and
              shipping details. We also keep order details so we can deliver
              your items and assist you if you need support.
            </p>
            <p>
              We use minimal analytics data to understand how visitors interact
              with the site, such as page views and device type.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">How we use data</h2>
            <p>
              Your information helps us process orders, provide customer
              support, and share important updates about your purchase. We also
              use it to improve the shopping experience and make the site feel
              smoother and faster for you.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Cookies &amp; analytics</h2>
            <p>
              We use cookies to keep your cart and favorites working. We also
              use Google Analytics 4 to measure visits and improve performance.
              We do not sell your personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Your rights</h2>
            <p>
              You can request access, updates, or deletion of your information
              at any time. If you have questions, contact us at{" "}
              <span className="font-semibold text-white">support@fishyourstyle.com</span>.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
