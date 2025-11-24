import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Fish Your Style",
  description: "Manage orders and products for Fish Your Style.",
};

export default function AdminPage() {
  return (
    <section className="w-full space-y-4">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Admin dashboard</h1>
        <p className="max-w-2xl text-slate-600">
          This page will be protected by admin roles. We will add orders and
          product management once Firestore and Auth are ready.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-slate-600">
        <p>🛠️ Orders list, status updates, and product CRUD plug in here.</p>
      </div>
    </section>
  );
}
