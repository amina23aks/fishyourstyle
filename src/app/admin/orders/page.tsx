export default function AdminOrdersPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Orders</p>
        <h1 className="text-3xl font-semibold text-white">Orders</h1>
        <p className="max-w-2xl text-sky-100/85">
          This page will show an admin table for orders (ID, date, customer, status, total) with filters and actions to
          change order status.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sky-100/90">
        <p className="text-sm text-sky-100/80">Admin tools for order management will appear here.</p>
        <p className="mt-2 text-lg font-semibold text-white">🧭 Orders dashboard coming soon</p>
      </div>
    </div>
  );
}
