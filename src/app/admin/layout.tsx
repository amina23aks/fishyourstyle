"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAdmin } from "@/lib/admin";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/account");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, loading, router, user]);

  if (loading) {
    return (
      <AdminLoader
        title="Checking admin access"
        subtitle="Hang tight while we verify your session."
      />
    );
  }

  if (!user || !isAdmin) {
    return (
      <AdminLoader
        title="Redirecting"
        subtitle="You need admin access to view this area."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="w-full max-w-full rounded-3xl border border-white/10 bg-white/10 p-6 text-sky-50 shadow-2xl shadow-sky-900/40 backdrop-blur lg:w-64 lg:flex-shrink-0">
          <div className="mb-6 space-y-1 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200">
              Admin
            </p>
            <h2 className="text-xl font-semibold text-white">
              Control center
            </h2>
            <p className="text-sm text-sky-100/80">Manage store operations</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition shadow-sm shadow-sky-900/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70 focus-visible:ring-offset-0 ${
                    isActive
                      ? "border-white/30 bg-white/15 text-white ring-1 ring-white/40"
                      : "border-white/5 text-sky-100"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-sky-100/70">→</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-sky-50 shadow-2xl shadow-sky-900/40 backdrop-blur lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminLoader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-6 py-5 text-sky-50 shadow-2xl shadow-sky-900/40 backdrop-blur">
        <span className="h-11 w-11 animate-spin rounded-full border-4 border-white/60 border-t-transparent" />
        <div className="space-y-1">
          <p className="text-lg font-semibold text-white">{title}</p>
          {subtitle ? (
            <p className="text-sm text-sky-100/80">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
