"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import AuthModal from "@/components/AuthModal";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/auth";

function getOrderCount(user: { orderCount?: number } | null) {
  if (!user || typeof user.orderCount !== "number") return null;
  return user.orderCount;
}

export default function AccountClient() {
  const { user, loading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const displayName = user?.displayName?.trim() || "Customer";
  const email = user?.email || "No email on file";
  const orderCount = getOrderCount(user as { orderCount?: number } | null);
  const loyaltyValue = orderCount ?? 0;
  const loyaltyProgress = Math.min(loyaltyValue, 5) / 5;

  return (
    <PageShell>
      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200">My profile</p>
          <h1 className="text-3xl font-semibold text-white">My profile</h1>
          <p className="text-sm text-sky-100">
            Manage your profile, favorites, and order history from one place.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="h-[240px] rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-[240px] rounded-2xl bg-white/10 animate-pulse" />
          </div>
        ) : user ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/15 bg-slate-900/50 p-5 shadow-inner shadow-sky-900/40">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Profile</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold text-white">{displayName}</p>
                    <p className="text-sm text-sky-100">{email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="text-xs font-semibold text-sky-200 transition hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-sky-200">
                    <span>Loyalty: {loyaltyValue}/5 orders</span>
                    {orderCount === null && <span className="text-sky-300">Coming soon</span>}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all"
                      style={{ width: `${loyaltyProgress * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="/orders"
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <div className="relative h-40 w-full">
                    <Image
                      src="/myorder.png"
                      alt="My orders"
                      fill
                      sizes="(min-width: 1024px) 320px, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="text-lg font-semibold text-white">My orders</h2>
                    <p className="text-sm text-sky-100">Track and review past purchases.</p>
                    <span className="mt-auto text-xs font-semibold text-sky-200 group-hover:text-white">
                      View orders →
                    </span>
                  </div>
                </Link>
                <Link
                  href="/favorites"
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <div className="relative h-40 w-full">
                    <Image
                      src="/favorite.png"
                      alt="My favorites"
                      fill
                      sizes="(min-width: 1024px) 320px, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="text-lg font-semibold text-white">My favorites</h2>
                    <p className="text-sm text-sky-100">Keep your best finds saved here.</p>
                    <span className="mt-auto text-xs font-semibold text-sky-200 group-hover:text-white">
                      View favorites →
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            <aside className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm text-sky-100 shadow-inner shadow-sky-900/30">
              <h2 className="text-sm font-semibold text-white">Quick tips</h2>
              <ul className="space-y-2 text-xs text-sky-200">
                <li>Check order status and delivery details in one tap.</li>
                <li>Keep favorites synced across devices.</li>
                <li>More loyalty perks are on the way.</li>
              </ul>
            </aside>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-6 py-12 text-center shadow-inner shadow-sky-900/30">
            <p className="text-xl font-semibold text-white">Sign in to access your profile.</p>
            <p className="text-sm text-sky-200">Favorites and orders stay synced when you sign in.</p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-cyan-500/30 transition hover:from-sky-300 hover:to-cyan-200"
            >
              Sign in
            </button>
          </div>
        )}
      </section>
      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </PageShell>
  );
}
