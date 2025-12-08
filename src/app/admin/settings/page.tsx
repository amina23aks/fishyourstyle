export default function AdminSettingsPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Settings</p>
        <h1 className="text-3xl font-semibold text-white">Settings</h1>
        <p className="max-w-2xl text-sky-100/85">
          Here we will later configure store settings, admin preferences, and integrations.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sky-100/90">
        <p className="text-sm text-sky-100/80">Configuration tools will be added in a future update.</p>
        <p className="mt-2 text-lg font-semibold text-white">⚙️ Settings controls on the horizon</p>
      </div>
    </div>
  );
}
