import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Account | Fish Your Style",
  description: "Access your Fish Your Style account and order history.",
};

export default function AccountPage() {
  return (
    <PageShell>
      <section className="w-full space-y-4 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Account</p>
          <h1 className="text-3xl font-semibold text-white">Account center</h1>
          <p className="max-w-2xl text-sky-100">
            Auth pages will land here (login/register) and show order history once
            Firebase Auth is wired up.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sky-100">
          <p>🔐 Protect this route with AuthProvider and admin checks later.</p>
        </div>
      </section>
    </PageShell>
  );
}
