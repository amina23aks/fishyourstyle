"use client";

import { useState, useEffect } from "react";
import { generateSlug, type Category } from "@/lib/categories";

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const cats = await res.json();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 mt-6">
      <h3 className="text-lg font-bold mb-2">Manage Categories</h3>
      <div className="flex gap-2 mb-3">
        <input
          value={newCategoryName}
          type="text"
          className="rounded-lg p-2 flex-1 text-black"
          placeholder="New category name"
          onChange={e => setNewCategoryName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={adding}
          className="rounded bg-emerald-400 px-3 py-2 text-xs font-bold text-black"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
      <div className="space-y-1">
        {categories.length === 0 ? <p>No categories yet.</p> : categories.map(cat => (
          <div key={cat.id || cat.slug} className="flex items-center gap-2 p-1">
            <span className="flex-1">{cat.name}</span>
            {!cat.isDefault && cat.id && (
              <button
                className="text-rose-500 text-lg"
                disabled={deleting === cat.id}
                onClick={() => handleDelete(cat.id)}
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

