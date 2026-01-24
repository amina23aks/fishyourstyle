import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Fish Your Style",
  description: "Learn what data Fish Your Style collects and how it is used.",
};

export default function PrivacyPolicyPage() {
  const currentYear = 2025;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 text-slate-100">
      <div className="space-y-8 rounded-2xl bg-slate-950/60 p-8 shadow-xl shadow-slate-900/30">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-slate-300">Last updated: {currentYear}</p>
        </header>

        <div className="space-y-6 text-sm leading-6 text-slate-200">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">What We Collect</h2>
            <p>
              When you create an account or place an order, we collect basic
              information such as your name, phone number, and shipping details.
              We also keep your order details so we can complete delivery and
              provide support if needed.
            </p>
            <p>
              We use limited analytics data to understand how visitors use our
              website, such as page views and device type.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">How We Use Your Data</h2>
            <ul className="list-inside list-disc space-y-1 text-slate-200">
              <li>Process and confirm your order.</li>
              <li>Contact you to verify order details if needed.</li>
              <li>Provide support and updates related to your purchase.</li>
              <li>Improve your shopping experience and website performance.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Cookies &amp; Analytics</h2>
            <p>
              We use cookies to keep your cart, preferences, and browsing
              experience working properly. We also use analytics tools to help
              improve performance. We do not sell or trade your personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">Your Rights</h2>
            <p>
              You can request to review, update, or delete your personal
              information. If you have any questions or concerns, please reach
              out through the Contact page on our website.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
