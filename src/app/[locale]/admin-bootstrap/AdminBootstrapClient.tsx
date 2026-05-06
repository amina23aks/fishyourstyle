"use client";

import { useEffect, useState } from "react";

import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/auth";
import { useAuthModal } from "@/context/auth-modal";
import { useLocale } from "@/i18n/I18nProvider";
import { localizePathname } from "@/i18n/paths";

type BootstrapStatus = {
  kind: "idle" | "checking" | "eligible" | "blocked" | "submitting" | "success" | "error";
  message: string;
};

export default function AdminBootstrapClient() {
  const locale = useLocale();
  const { user, loading } = useAuth();
  const { openModal } = useAuthModal();
  const [status, setStatus] = useState<BootstrapStatus>({
    kind: "idle",
    message: "Sign in as SUPER_ADMIN_EMAIL to check bootstrap access.",
  });

  useEffect(() => {
    let cancelled = false;

    if (loading) {
      setStatus({ kind: "checking", message: "Checking your Firebase sign-in session..." });
      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      setStatus({ kind: "idle", message: "Sign in as SUPER_ADMIN_EMAIL to continue." });
      return () => {
        cancelled = true;
      };
    }

    const currentUser = user;

    async function checkEligibility() {
      setStatus({ kind: "checking", message: "Confirming this account matches SUPER_ADMIN_EMAIL..." });

      try {
        const token = await currentUser.getIdToken(true);
        const response = await fetch("/api/admin/bootstrap-status", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json().catch(() => ({}))) as { eligible?: boolean; message?: string };

        if (cancelled) return;

        if (response.ok && payload.eligible) {
          setStatus({ kind: "eligible", message: "This signed-in account is allowed to bootstrap itself." });
          return;
        }

        setStatus({
          kind: "blocked",
          message: payload.message ?? "This signed-in account is not allowed to use the bootstrap helper.",
        });
      } catch (error) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: error instanceof Error ? error.message : "Unable to check bootstrap access.",
        });
      }
    }

    void checkEligibility();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  async function handleBootstrap() {
    if (!user || status.kind !== "eligible") return;

    setStatus({ kind: "submitting", message: "Bootstrapping admin claim for your current UID..." });

    try {
      const token = await user.getIdToken(true);
      const response = await fetch("/api/admin/claim", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: user.uid }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; uid?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Admin bootstrap failed.");
      }

      setStatus({
        kind: "success",
        message: `Success. Admin claim was set for your current UID (${payload.uid ?? user.uid}). Sign out and back in if /admin does not open immediately.`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Admin bootstrap failed.",
      });
    }
  }

  const canBootstrap = status.kind === "eligible";
  const isBusy = status.kind === "checking" || status.kind === "submitting";

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-amber-200/30 bg-slate-950/75 p-6 text-sky-50 shadow-2xl shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
            Temporary developer-only helper
          </p>
          <h1 className="text-3xl font-semibold text-white">Admin bootstrap</h1>
          <p className="text-sm text-sky-100">
            Phase 1 only. This page never displays or logs your Firebase ID token and can only submit the current signed-in UID.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-sky-100">
          <p>
            Signed in as: <span className="font-semibold text-white">{user?.email ?? "Not signed in"}</span>
          </p>
          <p className="mt-1 break-all">
            Current UID: <span className="font-mono text-xs text-sky-50">{user?.uid ?? "Not available"}</span>
          </p>
        </div>

        <div
          className={`rounded-2xl border p-4 text-sm ${
            status.kind === "success"
              ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-50"
              : status.kind === "error" || status.kind === "blocked"
                ? "border-rose-300/40 bg-rose-500/15 text-rose-50"
                : "border-sky-200/30 bg-sky-500/15 text-sky-50"
          }`}
          role="status"
        >
          {status.message}
        </div>

        {!user ? (
          <button
            type="button"
            onClick={() => openModal({ returnTo: localizePathname(locale, "/admin-bootstrap") })}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-cyan-500/30 transition hover:from-sky-300 hover:to-cyan-200"
          >
            Sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBootstrap}
            disabled={!canBootstrap || isBusy}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-orange-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-orange-500/30 transition hover:from-amber-200 hover:to-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.kind === "submitting" ? "Bootstrapping..." : "Bootstrap my admin claim"}
          </button>
        )}

        <p className="text-xs text-sky-200/80">
          Remove this temporary page after the super admin claim is confirmed.
        </p>
      </section>
    </PageShell>
  );
}
