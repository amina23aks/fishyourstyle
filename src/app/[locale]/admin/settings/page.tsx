import HomeSettingsForm from "./HomeSettingsForm";
import ShopFiltersSettingsForm from "./ShopFiltersSettingsForm";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Settings</p>
        <h1 className="text-3xl font-semibold text-white">Homepage settings</h1>
        <p className="max-w-2xl text-sky-100/85">
          Control the homepage FLOW featured section and optional home shop preview.
          Settings are saved to Firestore at siteSettings/home.
        </p>
      </div>

      <HomeSettingsForm />

      <ShopFiltersSettingsForm />
    </div>
  );
}
