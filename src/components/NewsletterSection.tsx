"use client";

import { FormEvent, useMemo, useState } from "react";

import type { Locale } from "@/i18n/config";

type NewsletterSectionProps = {
  locale: Locale;
};

function isValidNewsletterEmail(email: string): boolean {
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const cards = [
  {
    title: "NEW DROPS",
    description: "Discover upcoming collections before they launch.",
  },
  {
    title: "EARLY ACCESS",
    description: "Get notified before pieces go public.",
  },
  {
    title: "RESTOCK ALERTS",
    description: "Never miss your favorite pieces again.",
  },
];

export default function NewsletterSection({ locale }: NewsletterSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidNewsletterEmail(normalizedEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, locale, source: "homepage" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Please enter a valid email.");
      }

      setEmail("");
      setStatus("success");
      setMessage("You’re in. We’ll keep you updated.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Please enter a valid email.");
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-100/20 bg-slate-950 px-5 py-12 text-white shadow-[0_24px_80px_rgba(8,47,73,0.45)] sm:px-8 md:px-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.28),transparent_34%),linear-gradient(135deg,rgba(8,47,73,0.96),rgba(15,23,42,0.98)_55%,rgba(3,105,161,0.85))]" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-200/20 bg-cyan-200/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-9">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-cyan-100/80">
            Drop Updates
          </p>
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl md:text-5xl">
            STAY IN THE CURRENT
          </h2>
          <p className="max-w-2xl text-base text-cyan-50/80 sm:text-lg">
            Be first to know about new drops, restocks, and exclusive updates.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group min-h-44 rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-[0_18px_45px_rgba(2,6,23,0.24)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-100/40 hover:bg-white/[0.12]"
            >
              <div className="mb-6 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-200 to-white/70 transition group-hover:w-16" />
              <h3 className="text-lg font-black uppercase tracking-[0.16em] text-white">
                {card.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-cyan-50/75">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/15 bg-slate-950/35 p-3 shadow-inner shadow-black/20 backdrop-blur md:flex md:items-center md:gap-3"
          noValidate
        >
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "loading") {
                setStatus("idle");
                setMessage("");
              }
            }}
            placeholder="you@example.com"
            aria-label="Email address"
            autoComplete="email"
            className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/95 px-5 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-cyan-200 focus:ring-4 focus:ring-cyan-200/25"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-3 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-cyan-100 px-6 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_16px_36px_rgba(125,211,252,0.28)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 md:mt-0 md:w-auto md:min-w-56"
          >
            {status === "loading" ? "Joining…" : "Join The Current"}
          </button>
        </form>

        {message ? (
          <p
            className={`text-sm font-semibold ${status === "success" ? "text-cyan-100" : "text-rose-200"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
