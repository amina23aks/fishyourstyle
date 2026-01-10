"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth";
import { useAuthModal } from "@/context/auth-modal";
import PageShell from "@/components/PageShell";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebaseClient";

function ShoppingCartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-200" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H7" />
      <circle cx="10" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </svg>
  );
}

function BadgePercentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-200" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 3h12l3 5-9 13L3 8l3-5z" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="15" cy="15" r="1" />
      <path d="M9.5 14.5l5-5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-200" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 3l2.9 5.9 6.5.9-4.7 4.5 1.1 6.4L12 17l-5.8 3.1 1.1-6.4L2.6 9.8l6.5-.9L12 3z" />
    </svg>
  );
}

function AccountContent() {
  const { user, loading } = useAuth();
  const { openModal } = useAuthModal();
  const displayName = user?.displayName || "Customer";
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [docExists, setDocExists] = useState<boolean | null>(null);
  const [loyaltyRewardAvailable, setLoyaltyRewardAvailable] = useState(false);
  const [loyaltyRewardPercent, setLoyaltyRewardPercent] = useState(8);
  const [loyaltyCycleSize, setLoyaltyCycleSize] = useState(5);
  const progress = useMemo(() => {
    const safeCount = Math.max(orderCount ?? 0, 0);
    return Math.max(0, Math.min(safeCount, 5));
  }, [orderCount]);

  useEffect(() => {
    if (!user) {
      setOrderCount(null);
      setDocExists(null);
      setLoyaltyRewardAvailable(false);
      setLoyaltyRewardPercent(8);
      setLoyaltyCycleSize(5);
      return;
    }

    const db = getDb();
    if (!db) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setDocExists(false);
          try {
            await setDoc(
              userRef,
              {
                orderCount: 0,
                loyaltyRewardAvailable: false,
                loyaltyRewardPercent: 8,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (error) {
            console.error("[account] Failed to create user doc", error);
          }
          return;
        }
        setDocExists(true);
        const data = snapshot.data();
        const count = typeof data?.orderCount === "number" ? data.orderCount : null;
        const rewardAvailable = Boolean(data?.loyaltyRewardAvailable);
        const rewardPercent =
          typeof data?.loyaltyRewardPercent === "number" ? data.loyaltyRewardPercent : 8;
        const cycleSize =
          typeof data?.loyaltyCycleSize === "number" && data.loyaltyCycleSize > 0
            ? data.loyaltyCycleSize
            : 5;
        setOrderCount(count);
        setLoyaltyRewardAvailable(rewardAvailable);
        setLoyaltyRewardPercent(rewardPercent);
        setLoyaltyCycleSize(cycleSize);
      },
      (error) => {
        console.error("[account] user doc snapshot error", error);
      }
    );

    // Dev helper: reset loyalty by setting users/{uid}.orderCount = 0 in Firestore.
    return () => unsubscribe();
  }, [user]);

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
          <h1 className="text-3xl font-semibold text-white">My profile</h1>
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
          <section className="space-y-6 rounded-2xl border border-white/15 bg-slate-900/40 p-6 shadow-inner shadow-sky-900/30">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">My profile</p>
              <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
              <p className="text-sm text-sky-200">{user.email}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-white">
                <span>Loyalty: {progress} / 5 orders</span>
              </div>
              {process.env.NODE_ENV !== "production" && user ? (
                <p className="text-[11px] text-sky-200/80">
                  Debug: uid={user.uid} | orderCount={orderCount ?? "missing"} | docExists=
                  {docExists === null ? "unknown" : docExists ? "true" : "false"} | path=users/{user.uid}
                </p>
              ) : null}
              {loyaltyRewardAvailable ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50 shadow-inner shadow-emerald-900/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200/40 bg-emerald-500/20">
                    <BadgePercentIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Unlocked: Your next order gets {loyaltyRewardPercent}% off.
                    </p>
                    <p className="text-xs text-emerald-100/80">Use it on your next checkout.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const circleIndex = index + 1;
                      const isActive = circleIndex <= progress;
                      return (
                        <span
                          key={index}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                            isActive
                              ? "border-sky-200/80 bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900"
                              : "border-white/15 bg-white/10 text-white/50"
                          }`}
                        >
                          {isActive ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <path d="M5 12l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-sky-200">
                    Reward: {loyaltyRewardPercent}% after 5 orders
                  </p>
                  <div className="space-y-2 text-xs text-sky-100">
                    <div className="flex items-center gap-2">
                      <ShoppingCartIcon />
                      <span>Place 5 orders to unlock rewards.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgePercentIcon />
                      <span>After your 5th order, you get {loyaltyRewardPercent}% off.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarIcon />
                      <span>Discount applies automatically when available.</span>
                    </div>
                  </div>
                </>
              )}
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
