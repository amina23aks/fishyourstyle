export default function AdminProductsPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Products</p>
        <h1 className="text-3xl font-semibold text-white">Products</h1>
        <p className="max-w-2xl text-sky-100/85">
          This page will allow managing products (create, edit, delete, set discounts, manage stock, upload images).
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sky-100/90">
        <p className="text-sm text-sky-100/80">Product management tools will be available soon.</p>
        <p className="mt-2 text-lg font-semibold text-white">🎣 Product catalog controls coming next</p>
      </div>
    </div>
  );
}
