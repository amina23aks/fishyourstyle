"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "@/i18n/I18nProvider";

const updateCards = [
  {
    titleKey: "dropUpdates.newDropsTitle",
    bodyKey: "dropUpdates.newDropsBody",
    icon: "sparkle",
  },
  {
    titleKey: "dropUpdates.earlyAccessTitle",
    bodyKey: "dropUpdates.earlyAccessBody",
    icon: "mail",
  },
  {
    titleKey: "dropUpdates.restockAlertsTitle",
    bodyKey: "dropUpdates.restockAlertsBody",
    icon: "bell",
  },
] as const;

function DropUpdateIcon({ icon }: { icon: (typeof updateCards)[number]["icon"] }) {
  if (icon === "sparkle") {
    return (
      <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" aria-hidden="true">
        <path d="M24 6l3.6 10.8L38 20.4l-10.4 3.8L24 35l-3.6-10.8L10 20.4l10.4-3.6L24 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M38 30l1.6 4.4L44 36l-4.4 1.6L38 42l-1.6-4.4L32 36l4.4-1.6L38 30Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "mail") {
    return (
      <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" aria-hidden="true">
        <rect x="9" y="14" width="30" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M11 17l13 10 13-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" aria-hidden="true">
      <path d="M16 22a8 8 0 0 1 16 0c0 8 4 9 4 12H12c0-3 4-4 4-12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 38a3.5 3.5 0 0 0 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DropUpdatesSection() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setMessage(null);
      setError(t("dropUpdates.invalidEmail"));
      return;
    }

    setError(null);
    setMessage(t("dropUpdates.success"));
    setEmail("");
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-cyan-100/20 bg-[radial-gradient(circle_at_18%_0%,rgba(125,211,252,0.28),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,#063a5b_0%,#0b5f86_46%,#0d83ad_100%)] px-6 py-14 text-center text-sky-50 shadow-[0_28px_70px_rgba(8,47,73,0.42)] md:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
          {t("dropUpdates.eyebrow")}
        </p>
        <h2 className="mt-3 text-4xl font-extrabold uppercase tracking-[-0.02em] text-white sm:text-5xl">
          {t("dropUpdates.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-sky-50/82">
          {t("dropUpdates.subtitle")}
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {updateCards.map((item) => (
          <div
            key={item.titleKey}
            className="rounded-[1.6rem] border border-white/18 bg-white/[0.12] p-6 text-center shadow-[0_18px_45px_rgba(7,47,72,0.28)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-100/35 hover:bg-white/[0.16]"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100/24 bg-cyan-50/10 text-cyan-50 shadow-inner shadow-sky-950/20">
              <DropUpdateIcon icon={item.icon} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
              {t(item.titleKey)}
            </h3>
            <p className="mt-3 text-sm leading-6 text-sky-50/74">
              {t(item.bodyKey)}
            </p>
          </div>
        ))}
      </div>

      <form
        className="mx-auto mt-9 flex max-w-xl flex-col gap-3 rounded-full border border-white/16 bg-white/12 p-2 shadow-inner shadow-sky-950/20 backdrop-blur sm:flex-row"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="drop-updates-email">
          {t("dropUpdates.emailLabel")}
        </label>
        <input
          id="drop-updates-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("dropUpdates.emailPlaceholder")}
          className="min-h-12 flex-1 rounded-full border border-transparent bg-white px-5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-cyan-200 focus:ring-2 focus:ring-cyan-100/70"
        />
        <button
          type="submit"
          className="min-h-12 rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-500 px-6 text-sm font-bold uppercase tracking-[0.08em] text-slate-950 shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 hover:from-cyan-100 hover:via-sky-200 hover:to-blue-400"
        >
          {t("dropUpdates.cta")}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm font-medium text-emerald-100">{message}</p> : null}
      {error ? <p className="mt-3 text-sm font-medium text-rose-100">{error}</p> : null}
    </section>
  );
}
