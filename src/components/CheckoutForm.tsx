"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { addOrder } from "@/lib/orders";

const initialForm = {
  name: "",
  email: "",
  items: "",
  notes: "",
  total: "",
};

export default function CheckoutForm() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const totalValue = Number(form.total);

    if (!form.name.trim() || !form.email.trim() || Number.isNaN(totalValue)) {
      setError("Name, email, and total are required.");
      return;
    }

    if (totalValue <= 0) {
      setError("Total must be greater than zero.");
      return;
    }

    addOrder({
      customerName: form.name.trim(),
      customerEmail: form.email.trim(),
      itemsSummary: form.items.trim() || "Custom order",
      notes: form.notes.trim() || undefined,
      total: Math.round(totalValue * 100) / 100,
    });

    setForm(initialForm);
    router.push("/orders");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-6">
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="w-full rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-slate-900 shadow-inner shadow-sky-100 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="Yasmine Sailor"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="w-full rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-slate-900 shadow-inner shadow-sky-100 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="sailor@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="total">
          Order total (DZD)
        </label>
        <input
          id="total"
          name="total"
          type="number"
          min="0"
          step="0.01"
          value={form.total}
          onChange={(event) => setForm({ ...form, total: event.target.value })}
          className="w-full rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-slate-900 shadow-inner shadow-sky-100 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="4500"
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="items">
          Items in your cart
        </label>
        <textarea
          id="items"
          name="items"
          value={form.items}
          onChange={(event) => setForm({ ...form, items: event.target.value })}
          className="min-h-[96px] w-full rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-slate-900 shadow-inner shadow-sky-100 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="Oversized hoodie (M), Premium tee (L)"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="notes">
          Delivery notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          className="min-h-[96px] w-full rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-slate-900 shadow-inner shadow-sky-100 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          placeholder="Building entry code, preferred delivery times, etc."
        />
      </div>

      {error && (
        <div className="md:col-span-2 rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 shadow-inner shadow-rose-100">
          {error}
        </div>
      )}

      <div className="md:col-span-2 flex items-center justify-end">
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:-translate-y-0.5"
        >
          Place order
        </button>
      </div>
    </form>
  );
}
