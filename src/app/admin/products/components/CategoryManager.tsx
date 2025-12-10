"use client";

import { useState } from "react";

import { generateSlug } from "@/lib/categories";
import type { SelectableOption } from "@/types/selectable";

type CategoryManagerProps = {
  categories: SelectableOption[];
  onCategoriesChange: (next: SelectableOption[]) => void;
  onReload: () => Promise<void>;
  loading?: boolean;
};

const mergeBySlug = (base: SelectableOption[], extra: SelectableOption[]) => {
  const map = new Map<string, SelectableOption>();
  base.forEach((item) => map.set(item.slug, item));
  extra.forEach((item) => map.set(item.slug, { ...item, isDefault: map.get(item.slug)?.isDefault }));
  return Array.from(map.values());
};

export function CategoryManager({ categories, onCategoriesChange, onReload, loading }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const slug = generateSlug(trimmed);
    setAdding(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, slug, type: "category" }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      const { id } = await res.json();
      onCategoriesChange(mergeBySlug(categories, [{ id, name: trimmed, slug, isDefault: false }]));
      setNewCategoryName("");
      await onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (category: SelectableOption) => {
    if (!category.id || category.isDefault) return;
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    setDeleting(category.id);
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      onCategoriesChange(categories.filter((cat) => cat.slug !== category.slug));
      await onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const ordered = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-sky-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Manage categories</p>
          <p className="text-xs text-sky-100/70">Add new entries and remove custom ones. Defaults stay protected.</p>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          Refresh
        </button>
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
              void handleAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-950 shadow shadow-emerald-900/40 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
        {loading ? (
          <p className="text-sm text-sky-100/80">Loading categories...</p>
        ) : ordered.length === 0 ? (
          <p className="text-sm text-sky-100/80">No categories yet.</p>
        ) : (
          ordered.map((cat) => (
            <div
              key={cat.id ?? cat.slug}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <span className="font-semibold">{cat.name}</span>
              {cat.isDefault ? (
                <span className="text-[11px] uppercase tracking-wide text-sky-100/70">Default</span>
              ) : (
                <button
                  type="button"
                  disabled={deleting === cat.id}
                  onClick={() => handleDelete(cat)}
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
    </section>
  );
}
