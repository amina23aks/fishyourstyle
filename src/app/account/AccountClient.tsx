"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import PageShell from "@/components/PageShell";

// Helper to extract the best auth code
function extractAuthCode(err: unknown): string {
  if (!err) return "unknown";

  if (typeof err === "object" && err !== null) {
    if ("code" in err && typeof (err as { code?: unknown }).code === "string") {
      return (err as { code: string }).code;
    }

    if (
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string"
    ) {
      // Example message: "Firebase: Error (auth/invalid-credential)."
      const match = (err as { message: string }).message.match(/\((auth\/[^)]+)\)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return "unknown";
}

// Strongly-typed form modes
type Mode = "login" | "register";

export default function AccountClient() {
  const {
    user,
    loading,
    signIn,
    register,
    signInWithGoogle,
    signOut,
  } = useAuth();

  // Tabs, fields, errors, UI state
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inputErrors, setInputErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset form/errors on tab switch
  const handleTabSwitch = (m: Mode) => {
    setMode(m);
    setEmail("");
    setPassword("");
    setInputErrors({});
    setError(null);
  };

  // Main (login/register) submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputErrors({});
    setError(null);
    setBusy(true);

    // Register: client-side validation
    if (mode === "register") {
      const errs: { email?: string; password?: string } = {};
      if (!email) errs.email = "Please enter your email address.";
      if (password.length < 6) errs.password = "Password must be at least 6 characters.";
      setInputErrors(errs);
      if (Object.keys(errs).length > 0) {
        setBusy(false);
        return;
      }
    }

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await register(email, password);
      }
      // Firebase should log user in and auto-switch UI
    } catch (err: unknown) {
      const code = extractAuthCode(err);
      setError(getAuthErrorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  // Google handler (used in both tabs)
  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = extractAuthCode(err);
      if (code === "auth/popup-closed-by-user") {
        setError(null);
      } else {
        setError(getAuthErrorMessage(code));
      }
    } finally {
      setBusy(false);
    }
  };

  // Loading skeleton state
  if (loading) {
    return (
      <PageShell>
        <section className="w-full space-y-6 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <div className="h-[300px] rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-[200px] rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="w-full space-y-6 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        {/* Heading and intro */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Account center</h1>
          <p className="max-w-2xl text-sky-100">
            Sign in to link your orders to your account or register with an email and password, or Google. Guest checkout is also available.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          {/* LEFT COLUMN */}
          <section className="space-y-4 rounded-2xl border border-white/15 bg-slate-900/40 p-5 shadow-inner shadow-sky-900/30">
            {user ? (
              <div className="flex flex-col items-center py-8 gap-4 text-center">
                <h2 className="text-xl font-semibold text-white">You’re already signed in.</h2>
                <p className="text-sky-100 mb-3">You can keep shopping or view the history of your orders linked to this account.</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Link
                    href="/orders"
                    className="px-4 py-2 rounded-lg bg-white text-sky-900 font-semibold border border-white/10 shadow hover:bg-sky-100 transition"
                  >
                    View my orders
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="px-4 py-2 rounded-lg bg-transparent border border-white/20 text-white font-semibold hover:bg-white/10 transition"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 transition ${
                      mode === "login"
                        ? "bg-white text-slate-900 shadow-sm shadow-white/30"
                        : "border border-white/20 text-white hover:-translate-y-0.5 hover:bg-white/10"
                    }`}
                    onClick={() => handleTabSwitch("login")}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 transition ${
                      mode === "register"
                        ? "bg-white text-slate-900 shadow-sm shadow-white/30"
                        : "border border-white/20 text-white hover:-translate-y-0.5 hover:bg-white/10"
                    }`}
                    onClick={() => handleTabSwitch("register")}
                  >
                    Register
                  </button>
                  <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                    {mode === "login" ? "Existing customers" : "Create a new account"}
                  </span>
                </div>
                <form className="space-y-3" onSubmit={handleSubmit} noValidate>
                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-medium text-sky-100">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={`w-full rounded-lg border ${inputErrors.email ? "border-rose-400 bg-rose-100 text-rose-900 placeholder:text-rose-400" : "border-white/15 bg-white/10 text-white placeholder:text-sky-200"} px-3 py-2 text-sm shadow-inner shadow-sky-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                      required
                      autoComplete={mode === "register" ? "new-email" : "email"}
                    />
                    {inputErrors.email && <div className="text-xs text-rose-200 mt-1">{inputErrors.email}</div>}
                  </div>
                  {/* Password */}
                  <div className="space-y-1">
                    <label htmlFor="password" className="text-xs font-medium text-sky-100">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`w-full rounded-lg border ${inputErrors.password ? "border-rose-400 bg-rose-100 text-rose-900 placeholder:text-rose-400" : "border-white/15 bg-white/10 text-white placeholder:text-sky-200"} px-3 py-2 text-sm shadow-inner shadow-sky-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                      required
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                    />
                    {inputErrors.password && <div className="text-xs text-rose-200 mt-1">{inputErrors.password}</div>}
                    {mode === "register" && (
                      <div className="text-xs text-sky-300 mt-1">
                        This password is only for your Fish Your Style account. It is <b>not</b> your email account password.
                      </div>
                    )}
                  </div>
                  {/* Error message (all errors except inline input) */}
                  {error && (
                    <div className="rounded-lg border border-rose-200/60 bg-rose-500/15 px-3 py-2 text-xs text-rose-50 shadow-inner shadow-rose-900/30">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? (mode === "register" ? "Creating account..." : "Signing in...") : mode === "login" ? "Login" : "Register"}
                  </button>
                </form>
                {/* Divider and Google */}
                <div className="space-y-2">
                  <p className="text-center text-xs text-sky-200">or</p>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-inner shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.91-6.91C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.99 6.2C12.43 12.7 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.5 24.5c0-1.57-.15-3.09-.43-4.56H24v9.11h12.65c-.55 2.98-2.24 5.51-4.76 7.21l7.44 5.79C43.73 38.77 46.5 32.1 46.5 24.5z" />
                      <path fill="#FBBC05" d="M10.54 28.98c-.48-1.42-.75-2.94-.75-4.48s.27-3.06.75-4.48l-7.99-6.2C.92 16.87 0 20.35 0 24c0 3.65.92 7.13 2.56 10.18l7.98-6.2z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.79l-7.44-5.79c-2.06 1.38-4.71 2.19-7.77 2.19-6.26 0-11.57-4.2-13.45-9.87l-7.99 6.2C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </>
            )}
          </section>
          {/* RIGHT COLUMN */}
          <section className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner shadow-sky-900/30">
            <h2 className="text-sm font-semibold text-white">Account status</h2>
            {user ? (
              <div className="space-y-2 text-sm text-sky-100">
                <span className="font-semibold text-green-300">Signed in</span>
                <p className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white">
                  {user.email || "Unknown email"}
                </p>
                <p className="break-all text-xs text-sky-200">
                  Your user ID: {user.uid}
                </p>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-full border mt-2 border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-sky-100">
                <span className="font-semibold text-sky-300">You are currently checking out as a guest.</span>
                <p className="text-xs text-sky-200">
                  Logging in will link future orders to your profile. It is optional and not required to place an order.
                </p>
                <p className="text-xs text-sky-200">
                  After signing in, any new orders will show up under your account in future Order history views.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </PageShell>
  );
}
