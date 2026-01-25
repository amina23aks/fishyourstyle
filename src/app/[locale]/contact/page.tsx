"use client";

import { FormEvent, useState } from "react";
import PageShell from "@/components/PageShell";
import Loader from "@/components/ui/Loader";
import { useTranslations } from "@/i18n/I18nProvider";

export default function ContactPage() {
  const t = useTranslations();
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
        throw new Error(data.error || t("contact.errorSend"));
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("contact.errorFallback");
      setError(message);
      setStatus("error");
    }
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg shadow-black/30">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200">{t("contact.title")}</p>
          <h1 className="text-3xl font-semibold">{t("contact.heading")}</h1>
          <p className="text-sm text-sky-100">{t("contact.subtitle")}</p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm text-sky-100">
            <span className="font-semibold text-white">{t("contact.nameLabel")}</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              placeholder={t("contact.namePlaceholder")}
            />
          </label>

          <label className="block space-y-1 text-sm text-sky-100">
            <span className="font-semibold text-white">{t("contact.emailLabel")}</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              placeholder={t("contact.emailPlaceholder")}
            />
          </label>

          <label className="block space-y-1 text-sm text-sky-100">
            <span className="font-semibold text-white">{t("contact.messageLabel")}</span>
            <textarea
              required
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              className="min-h-[140px] w-full resize-none rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              placeholder={t("contact.messagePlaceholder")}
            />
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-50">
              {error}
            </div>
          )}

          {status === "success" && (
            <div className="rounded-lg border border-emerald-200/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-50">
              {t("contact.success")}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-shine inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/30 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_12px_26px_rgba(125,211,252,0.35)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? (
              <>
                <Loader size={16} className="text-slate-900" />
                {t("contact.submitting")}
              </>
            ) : (
              t("contact.submit")
            )}
          </button>
        </form>
      </main>
    </PageShell>
  );
}
