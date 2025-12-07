"use client";

import type { Metadata } from "next";
import { useState } from "react";

import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/auth";

export const metadata: Metadata = {
  title: "Account | Fish Your Style",
  description: "Access your Fish Your Style account and order history.",
};

export default function AccountPage() {
  const { user, loading, loginWithEmailPassword, registerWithEmailPassword, loginWithGoogle, logout } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    try {
      if (mode === "login") {
        await loginWithEmailPassword(email, password);
        setMessage("Signed in successfully.");
      } else {
        await registerWithEmailPassword(email, password);
        setMessage("Account created and signed in.");
      }
    } catch (authError) {
      const friendlyMessage = authError instanceof Error ? authError.message : "Authentication failed.";
      setError(friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const authenticatedEmail = user?.email ?? "Authenticated user";

  return (
    <PageShell>
      <section className="w-full space-y-6 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">Account</p>
          <h1 className="text-3xl font-semibold text-white">Account center</h1>
          <p className="max-w-2xl text-sky-100">
            Sign in to link your orders to your account or register with email/password or Google. Guest checkout remains
            available.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <section className="space-y-4 rounded-2xl border border-white/15 bg-slate-900/40 p-5 shadow-inner shadow-sky-900/30">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-3 py-1 transition ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm shadow-white/30"
                    : "border border-white/20 text-white hover:-translate-y-0.5 hover:bg-white/10"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full px-3 py-1 transition ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-sm shadow-white/30"
                    : "border border-white/20 text-white hover:-translate-y-0.5 hover:bg-white/10"
                }`}
              >
                Register
              </button>
              <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                {mode === "login" ? "Existing customers" : "Create a new account"}
              </span>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-medium text-sky-100">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-medium text-sky-100">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white shadow-inner shadow-sky-900/20 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-200/60 bg-rose-500/15 px-3 py-2 text-xs text-rose-50 shadow-inner shadow-rose-900/30">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-lg border border-emerald-200/60 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-50 shadow-inner shadow-emerald-900/30">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={busy || loading}
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Please wait..." : mode === "login" ? "Login" : "Register"}
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-center text-xs text-sky-200">or</p>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-inner shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.91-6.91C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.99 6.2C12.43 12.7 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.57-.15-3.09-.43-4.56H24v9.11h12.65c-.55 2.98-2.24 5.51-4.76 7.21l7.44 5.79C43.73 38.77 46.5 32.1 46.5 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.54 28.98c-.48-1.42-.75-2.94-.75-4.48s.27-3.06.75-4.48l-7.99-6.2C.92 16.87 0 20.35 0 24c0 3.65.92 7.13 2.56 10.18l7.98-6.2z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.91-5.79l-7.44-5.79c-2.06 1.38-4.71 2.19-7.77 2.19-6.26 0-11.57-4.2-13.45-9.87l-7.99 6.2C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                Continue with Google
              </button>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
            <h2 className="text-sm font-semibold text-white">Account status</h2>

            {loading ? (
              <p className="text-sm text-sky-100">Checking your session...</p>
            ) : user ? (
              <div className="space-y-2 text-sm text-sky-100">
                <p className="text-white">Signed in</p>
                <p className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white">{authenticatedEmail}</p>
                <p className="break-all text-xs text-sky-200">UID: {user.uid}</p>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-sky-100">
                <p className="text-white">You are currently checking out as a guest.</p>
                <p className="text-xs text-sky-200">
                  Logging in will link future orders to your profile. It is optional and not required to place an order.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </PageShell>
  );
}
