"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { useAdmin } from "@/lib/admin";
import {
  defaultPublicShopFilterSettings,
  type PublicShopFilterSettings,
} from "@/lib/filter-config";

export default function ShopFiltersSettingsForm() {
  const { user } = useAdmin();
  const [settings, setSettings] = useState<PublicShopFilterSettings>(
    defaultPublicShopFilterSettings,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const token = await user?.getIdToken(true);
    if (!token) throw new Error("Admin authentication is required.");
    return token;
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    getToken()
      .then((token) =>
        fetch("/api/admin/shop-filter-settings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "Unable to load shop filter settings.");
        }
        if (!cancelled) setSettings(data);
      })
      .catch((loadError) => {
        console.error("[admin/settings] Failed to load shop filters", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load shop filter settings.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [getToken, user]);

  function updateCategory(
    slug: string,
    key: "label" | "isVisibleOnShop" | "isComingSoon",
    value: string | boolean,
  ) {
    setSettings((previous) => ({
      ...previous,
      categories: {
        ...previous.categories,
        [slug]: { ...previous.categories[slug], [key]: value },
      },
    }));
  }

  function updateDesign(
    slug: string,
    key: "label" | "isVisibleOnShop",
    value: string | boolean,
  ) {
    setSettings((previous) => ({
      ...previous,
      designs: {
        ...previous.designs,
        [slug]: { ...previous.designs[slug], [key]: value },
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch("/api/admin/shop-filter-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save shop filter settings.");
      }
      setSettings(data);
      setMessage("Shop filter settings saved. /shop may take up to 5 minutes to revalidate.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save shop filter settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-sky-100/80">Loading shop filter settings…</p>;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Shop filters</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Categories</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(settings.categories).map(([slug, category]) => (
            <div key={slug} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <label className="space-y-2 text-sm font-semibold text-sky-50">
                <span>{slug}</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-sky-200"
                  value={category.label}
                  onChange={(event) => updateCategory(slug, "label", event.target.value)}
                />
              </label>
              <CheckboxField
                label="Visible on shop"
                checked={category.isVisibleOnShop}
                onChange={(checked) => updateCategory(slug, "isVisibleOnShop", checked)}
              />
              <CheckboxField
                label="Coming soon"
                checked={category.isComingSoon}
                onChange={(checked) => updateCategory(slug, "isComingSoon", checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold text-white">Design filters</h2>
        <div className="space-y-3">
          {Object.entries(settings.designs).map(([slug, design]) => (
            <div key={slug} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <label className="space-y-2 text-sm font-semibold text-sky-50">
                <span>{slug}</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-sky-200"
                  value={design.label}
                  onChange={(event) => updateDesign(slug, "label", event.target.value)}
                />
              </label>
              <CheckboxField
                label="Visible on shop"
                checked={design.isVisibleOnShop}
                onChange={(checked) => updateDesign(slug, "isVisibleOnShop", checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {message ? <p className="rounded-2xl bg-emerald-400/15 p-4 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-400/15 p-4 text-sm text-red-100">{error}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0b2e55] shadow-lg shadow-sky-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving…" : "Save shop filter settings"}
      </button>
    </form>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-sky-50 md:min-w-40">
      <span>{label}</span>
      <input
        className="h-5 w-5 accent-sky-300"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
