"use client";

import { useState } from "react";

import { generateSlug } from "@/lib/categories";
import type { SelectableOption } from "@/types/selectable";

type CategoryManagerProps = {
  categories: SelectableOption[];
  designThemes: SelectableOption[];
  onCategoriesChange: (next: SelectableOption[]) => void;
  onDesignThemesChange: (next: SelectableOption[]) => void;
  onReloadCategories: () => Promise<void>;
  onReloadDesignThemes: () => Promise<void>;
  loadingCategories?: boolean;
  loadingDesignThemes?: boolean;
};

const mergeBySlug = (base: SelectableOption[], extra: SelectableOption[]) => {
  const map = new Map<string, SelectableOption>();
  base.forEach((item) => map.set(item.slug, item));
  extra.forEach((item) => map.set(item.slug, { ...item, isDefault: map.get(item.slug)?.isDefault }));
  return Array.from(map.values());
};

export function CategoryManager({
  categories,
  designThemes,
  onCategoriesChange,
  onDesignThemesChange,
  onReloadCategories,
  onReloadDesignThemes,
  loadingCategories,
  loadingDesignThemes,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newDesignName, setNewDesignName] = useState("");
  const [adding, setAdding] = useState<"category" | "design" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async (type: "category" | "design") => {
    const rawName = type === "category" ? newCategoryName : newDesignName;
    const trimmed = rawName.trim();
    if (!trimmed) return;
    const slug = generateSlug(trimmed);
    setAdding(type);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, slug, type }),
      });
      if (!res.ok) throw new Error(`Failed to add ${type}`);
      const { id } = await res.json();
      const next = mergeBySlug(type === "category" ? categories : designThemes, [
        { id, name: trimmed, slug, isDefault: false },
      ]);
      if (type === "category") {
        onCategoriesChange(next);
        setNewCategoryName("");
        await onReloadCategories();
      } else {
        onDesignThemesChange(next);
        setNewDesignName("");
        await onReloadDesignThemes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(null);
    }
  };

  const handleDelete = async (item: SelectableOption, type: "category" | "design") => {
    if (!item.id || item.isDefault) return;
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    setDeleting(item.id);
    try {
      const res = await fetch(`/api/categories/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete ${type}`);
      if (type === "category") {
        onCategoriesChange(categories.filter((cat) => cat.slug !== item.slug));
        await onReloadCategories();
      } else {
        onDesignThemesChange(designThemes.filter((theme) => theme.slug !== item.slug));
        await onReloadDesignThemes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const orderedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const orderedDesigns = [...designThemes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Manage categories & designs</p>
          <p className="text-xs text-sky-100/70">Add new entries and remove custom ones. Defaults stay protected.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReloadCategories}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            Refresh categories
          </button>
          <button
            type="button"
            onClick={onReloadDesignThemes}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            Refresh designs
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Collections</p>
            {loadingCategories ? <span className="text-[11px] text-sky-100/70">Loading…</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd("category");
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleAdd("category")}
              disabled={adding === "category"}
              className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-950 shadow shadow-emerald-900/40 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adding === "category" ? "Adding..." : "Add"}
            </button>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            {loadingCategories ? (
              <p className="text-sm text-sky-100/80">Loading categories...</p>
            ) : orderedCategories.length === 0 ? (
              <p className="text-sm text-sky-100/80">No categories yet.</p>
            ) : (
              orderedCategories.map((cat) => (
                <div
                  key={`category-${cat.id ?? cat.slug}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <span className="font-semibold">{cat.name}</span>
                  {cat.isDefault ? (
                    <span className="text-[11px] uppercase tracking-wide text-sky-100/70">Default</span>
                  ) : (
                    <button
                      type="button"
                      disabled={deleting === cat.id}
                      onClick={() => handleDelete(cat, "category")}
                      className="text-lg text-rose-300 transition hover:text-rose-200 disabled:opacity-60"
                      aria-label={`Delete category ${cat.name}`}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Design themes</p>
            {loadingDesignThemes ? <span className="text-[11px] text-sky-100/70">Loading…</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={newDesignName}
              onChange={(e) => setNewDesignName(e.target.value)}
              placeholder="New design name"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/30 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd("design");
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleAdd("design")}
              disabled={adding === "design"}
              className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-950 shadow shadow-emerald-900/40 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adding === "design" ? "Adding..." : "Add"}
            </button>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            {loadingDesignThemes ? (
              <p className="text-sm text-sky-100/80">Loading design themes...</p>
            ) : orderedDesigns.length === 0 ? (
              <p className="text-sm text-sky-100/80">No design themes yet.</p>
            ) : (
              orderedDesigns.map((theme) => (
                <div
                  key={`design-${theme.id ?? theme.slug}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <span className="font-semibold">{theme.name}</span>
                  {theme.isDefault ? (
                    <span className="text-[11px] uppercase tracking-wide text-sky-100/70">Default</span>
                  ) : (
                    <button
                      type="button"
                      disabled={deleting === theme.id}
                      onClick={() => handleDelete(theme, "design")}
                      className="text-lg text-rose-300 transition hover:text-rose-200 disabled:opacity-60"
                      aria-label={`Delete design ${theme.name}`}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
