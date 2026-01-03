import type { Metadata } from "next";

import { AdminOverviewStats } from "./components/AdminOverviewStats";

export const metadata: Metadata = {
  title: "Admin | Fish Your Style",
  description: "Manage orders and products for Fish Your Style.",
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Overview</p>
        <h1 className="text-3xl font-semibold text-white">Admin Overview</h1>
        <p className="max-w-2xl text-sky-100/90">
          Welcome to the control center. These cards will soon display live stats about orders,
          revenue, and visitor trends so you can keep Fish Your Style running smoothly.
        </p>
      </div>

      <AdminOverviewStats />

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sky-100/90">
        <h2 className="text-xl font-semibold text-white">What to expect next</h2>
        <p className="mt-2 max-w-3xl">
          The admin dashboard will highlight store health at a glance with recent orders, revenue snapshots,
          fulfillment alerts, and quick links to manage products. We will also explore traffic insights to see
          how new customers find our sea-inspired streetwear.
        </p>
      </div>
    </div>
  );
}
