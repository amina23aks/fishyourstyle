import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account | Fish Your Style",
  description: "Access your Fish Your Style account and order history.",
};

export default function AccountPage() {
  return (
    <section className="w-full space-y-4">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Account</p>
        <h1 className="text-3xl font-semibold text-slate-900">Account center</h1>
        <p className="max-w-2xl text-slate-600">
          Auth pages will land here (login/register) and show order history once
          Firebase Auth is wired up.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-slate-600">
        <p>🔐 Protect this route with AuthProvider and admin checks later.</p>
      </div>
    </section>
  );
}
