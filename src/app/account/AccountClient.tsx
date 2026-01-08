"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useAuth } from "@/context/auth";
import { useAuthModal } from "@/context/auth-modal";
import PageShell from "@/components/PageShell";

function AccountContent() {
  const { user, loading, signOut } = useAuth();
  const { openModal } = useAuthModal();
  const displayName = user?.displayName || "Customer";
  const orderCount = 0;

  if (loading) {
    return (
      <PageShell>
        <section className="w-full space-y-6 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <div className="h-[260px] rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-[200px] rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="w-full space-y-6 rounded-3xl bg-white/10 p-6 text-sky-50 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">My account</h1>
          <p className="text-sm text-sky-100">
            Manage your orders, favorites, and loyalty in one place.
          </p>
        </div>

        {!user ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/15 bg-slate-900/40 px-6 py-12 text-center shadow-inner shadow-sky-900/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl">
              👋
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Welcome back</h2>
              <p className="text-sm text-sky-200">Sign in to see your account dashboard.</p>
            </div>
            <button
              type="button"
              onClick={() => openModal({ returnTo: "/account" })}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-cyan-500/30 transition hover:from-sky-300 hover:to-cyan-200"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <section className="space-y-6 rounded-2xl border border-white/15 bg-slate-900/40 p-6 shadow-inner shadow-sky-900/30">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Profile</p>
                <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
                <p className="text-sm text-sky-200">{user.email}</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-white">
                  <span>Loyalty: {orderCount} / 5 orders</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
                    Coming soon
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                    style={{ width: "0%" }}
                  />
                </div>
                <p className="text-xs text-sky-200">
                  Earn loyalty rewards as your orders grow.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="/orders"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-sm shadow-sky-900/30 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/10">
                    <Image src="/myorder.png" alt="My orders" fill className="object-contain p-2" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">My orders</h3>
                    <p className="text-xs text-sky-200">Track your latest purchases.</p>
                  </div>
                </Link>
                <Link
                  href="/favorites"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-sm shadow-sky-900/30 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/10">
                    <Image src="/favorite.png" alt="My favorites" fill className="object-contain p-2" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">My favorites</h3>
                    <p className="text-xs text-sky-200">See the items you saved.</p>
                  </div>
                </Link>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-6 shadow-inner shadow-sky-900/30">
              <h2 className="text-sm font-semibold text-white">Account actions</h2>
              <div className="space-y-3 text-sm text-sky-100">
                <p>Keep your account safe and continue exploring the latest drops.</p>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Sign out
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </PageShell>
  );
}

export default function AccountClient() {
  return (
    <Suspense fallback={null}>
      <AccountContent />
    </Suspense>
  );
}
