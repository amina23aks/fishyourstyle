import type { Metadata } from "next";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Admin | Fish Your Style",
  description: "Manage orders and products for Fish Your Style.",
};

export default function AdminPage() {
  return (
    <PageShell>
      <section className="w-full space-y-4 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Admin</p>
          <h1 className="text-3xl font-semibold text-white">Admin dashboard</h1>
          <p className="max-w-2xl text-sky-100">
            This page will be protected by admin roles. We will add orders and
            product management once Firestore and Auth are ready.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sky-100">
          <p>🛠️ Orders list, status updates, and product CRUD plug in here.</p>
        </div>
      </section>
    </PageShell>
  );
}
