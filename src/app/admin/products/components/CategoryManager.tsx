"use client";

import { useState, useEffect } from "react";
import { generateSlug, type Category } from "@/lib/categories";

type CategoryManagerProps = {
  onCategoriesChange?: (categories: Category[]) => void;
};

export function CategoryManager({ onCategoriesChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const cats = await res.json();
      setCategories(cats);
      onCategoriesChange?.(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;
    setAdding(true);
    try {
      const slug = generateSlug(newCategoryName);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim(), slug }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      setNewCategoryName("");
      await loadCategories();
    } catch (error) {
      console.error("Failed to add category:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/60">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Manage Categories</h3>
        <p className="text-xs text-white/60 mt-1">Add or remove product categories</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Category name"
          className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newCategoryName.trim()}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-xs text-white/50">No categories yet. Add one above.</p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-white">{cat.name}</p>
                <p className="text-xs text-white/50">slug: {cat.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                disabled={deleting === cat.id}
                className="rounded-full bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-50 transition hover:bg-rose-500/30 disabled:opacity-50"
              >
                {deleting === cat.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

