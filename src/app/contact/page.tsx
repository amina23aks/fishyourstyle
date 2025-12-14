"use client";

import { FormEvent, useState } from "react";
import PageShell from "@/components/PageShell";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send message.";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg shadow-black/30">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Contact</p>
          <h1 className="text-3xl font-semibold">Get in touch</h1>
          <p className="text-sm text-sky-100">
            Send us a note and we&apos;ll get back to you as soon as possible.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm text-sky-100">
            <span className="font-semibold text-white">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              placeholder="Your name"
            />
          </label>

          <label className="block space-y-1 text-sm text-sky-100">
            <span className="font-semibold text-white">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-1 text-sm text-sky-100">
            <span className="font-semibold text-white">Message</span>
            <textarea
              required
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              className="min-h-[140px] w-full resize-none rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              placeholder="How can we help?"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-50">
              {error}
            </div>
          )}

          {status === "success" && (
            <div className="rounded-lg border border-emerald-200/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-50">
              Message sent successfully. Thank you!
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/30 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Sending..." : "Send message"}
          </button>
        </form>
      </main>
    </PageShell>
  );
}
