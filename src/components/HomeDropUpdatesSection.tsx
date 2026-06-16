"use client";

import { FormEvent, useState } from "react";

const updateCards = [
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function HomeDropUpdatesSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!emailPattern.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          company: "",
          source: "homepage-drop-updates",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Please enter a valid email.");
      }

      setEmail("");
      setStatus("success");
      setMessage("You’re in. We’ll keep you updated.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please enter a valid email.";
      setStatus("error");
      setMessage(errorMessage || "Please enter a valid email.");
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 px-5 py-10 text-white shadow-[0_24px_70px_rgba(2,6,23,0.55)] sm:px-8 md:px-10 md:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(234,179,8,0.16),transparent_30%),linear-gradient(135deg,rgba(8,47,73,0.92),rgba(15,23,42,0.98)_58%,rgba(2,6,23,1))]" />
      <div className="absolute left-8 top-8 h-32 w-32 rounded-full bg-cyan-200/10 blur-3xl" />
      <div className="absolute bottom-0 right-10 h-28 w-44 rounded-full bg-amber-100/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200/90">DROP UPDATES</p>
          <h2 className="text-3xl font-semibold tracking-[0.08em] text-white sm:text-4xl">STAY IN THE CURRENT</h2>
          <p className="text-sm leading-6 text-sky-100/82 sm:text-base">
            Be first to know about new drops, restocks, and exclusive updates.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {updateCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/12 bg-white/[0.07] p-5 shadow-inner shadow-white/5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-sky-100/30 hover:bg-white/[0.1]"
            >
              <p className="text-sm font-semibold tracking-[0.18em] text-white">{card.title}</p>
              <p className="mt-3 text-sm leading-6 text-sky-100/78">{card.description}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-3">
          <div className="flex flex-col gap-3 rounded-full border border-white/15 bg-white/10 p-2 shadow-[0_14px_36px_rgba(2,6,23,0.32)] backdrop-blur-md sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="drop-updates-email">
              Email address
            </label>
            <input
              id="drop-updates-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status !== "loading") {
                  setStatus("idle");
                  setMessage(null);
                }
              }}
              placeholder="you@example.com"
              autoComplete="email"
              className="min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-sky-100/55 focus:border-white/20 focus:bg-white/5"
            />
            <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center rounded-full bg-sky-50 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {status === "loading" ? "Joining..." : "Join The Current"}
            </button>
          </div>
          {message ? (
            <p className={`text-center text-sm ${status === "success" ? "text-sky-100" : "text-rose-200"}`}>{message}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
