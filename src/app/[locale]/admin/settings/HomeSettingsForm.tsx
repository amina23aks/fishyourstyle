"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { useAdmin } from "@/lib/admin";

type FeaturedDropSettings = {
  title: string;
  label: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  maxProducts: number;
  active: boolean;
};

type HomeSettings = {
  showFeaturedDrop: boolean;
  showHomeShopSection: boolean;
  featuredDropSlug: "flow";
  featuredDrop: FeaturedDropSettings;
};

const fallbackSettings: HomeSettings = {
  showFeaturedDrop: true,
  showHomeShopSection: false,
  featuredDropSlug: "flow",
  featuredDrop: {
    title: "FLOW — DROP 01",
    label: "Find Your Flow.",
    subtitle:
      "The first chapter of Fish Your Style. A collection inspired by finding your own rhythm.",
    buttonText: "Discover FLOW",
    buttonLink: "#flow-drop",
    maxProducts: 4,
    active: true,
  },
};

export default function HomeSettingsForm() {
  const { user } = useAdmin();
  const [settings, setSettings] = useState<HomeSettings>(fallbackSettings);
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
        fetch("/api/admin/home-settings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || "Unable to load homepage settings.");
        }
        if (!cancelled) setSettings(data);
      })
      .catch((loadError) => {
        console.error("[admin/settings] Failed to load home settings", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load homepage settings.",
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

  function updateFeaturedDrop<K extends keyof FeaturedDropSettings>(
    key: K,
    value: FeaturedDropSettings[K],
  ) {
    setSettings((previous) => ({
      ...previous,
      featuredDrop: { ...previous.featuredDrop, [key]: value },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch("/api/admin/home-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...settings,
          featuredDrop: {
            ...settings.featuredDrop,
            active: settings.showFeaturedDrop,
          },
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to save homepage settings.");
      }
      setSettings(data);
      setMessage("Homepage settings saved. The homepage may take up to 5 minutes to revalidate.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save homepage settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-sky-100/80">Loading homepage settings…</p>;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <ToggleField
          label="Show Featured Drop Section"
          checked={settings.showFeaturedDrop}
          onChange={(checked) =>
            setSettings((previous) => ({ ...previous, showFeaturedDrop: checked }))
          }
        />
        <ToggleField
          label="Show Home Shop Section"
          checked={settings.showHomeShopSection}
          onChange={(checked) =>
            setSettings((previous) => ({ ...previous, showHomeShopSection: checked }))
          }
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 space-y-1">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Featured drop</p>
          <h2 className="text-xl font-semibold text-white">FLOW controls</h2>
          <p className="text-sm text-sky-100/75">
            Product selection stays locked to featuredDrops: [&quot;flow&quot;].
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Featured Drop Title" value={settings.featuredDrop.title} onChange={(value) => updateFeaturedDrop("title", value)} />
          <TextField label="Featured Drop Label" value={settings.featuredDrop.label} onChange={(value) => updateFeaturedDrop("label", value)} />
          <TextField label="Button Text" value={settings.featuredDrop.buttonText} onChange={(value) => updateFeaturedDrop("buttonText", value)} />
          <TextField label="Button Link" value={settings.featuredDrop.buttonLink} onChange={(value) => updateFeaturedDrop("buttonLink", value)} />
          <label className="space-y-2 text-sm font-semibold text-sky-50">
            <span>Max Products</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-sky-200"
              min={1}
              max={24}
              type="number"
              value={settings.featuredDrop.maxProducts}
              onChange={(event) => updateFeaturedDrop("maxProducts", Number(event.target.value))}
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2 text-sm font-semibold text-sky-50">
          <span>Featured Drop Subtitle</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-sky-200"
            value={settings.featuredDrop.subtitle}
            onChange={(event) => updateFeaturedDrop("subtitle", event.target.value)}
          />
        </label>
      </div>

      {message ? <p className="rounded-2xl bg-emerald-400/15 p-4 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-400/15 p-4 text-sm text-red-100">{error}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0b2e55] shadow-lg shadow-sky-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving…" : "Save homepage settings"}
      </button>
    </form>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-sky-50">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-sky-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-sky-50">
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
