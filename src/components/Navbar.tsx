"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";
import { AnimatePresence, motion } from "@/lib/motion";

import CartDrawer from "./cart/cart-drawer";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
  { href: "/orders", label: "Orders" },
];

const iconStyles = "h-5 w-5";

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={iconStyles}
      aria-hidden
    >
      <path d="M4 5h18l-1.8 8.1a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.6L4 3H1" />
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={iconStyles}
      aria-hidden
    >
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className={iconStyles}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-6.5-3.94-9-8.14C1 9.5 2.5 5 6.5 5A5.5 5.5 0 0 1 12 8.5 5.5 5.5 0 0 1 17.5 5C21.5 5 23 9.5 21 12.86 18.5 17.06 12 21 12 21Z"
      />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, loading: authLoading, signOut } = useAuth();
  const { totalQuantity, lastAddedAt } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lastAddedAt) return;
    setIsBumping(true);
    const timer = window.setTimeout(() => setIsBumping(false), 450);
    return () => window.clearTimeout(timer);
  }, [lastAddedAt]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isAccountMenuOpen &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsAccountMenuOpen(false);
  };

  const toggleDrawer = () => setIsDrawerOpen((previous) => !previous);
  const toggleMenu = () => setIsMenuOpen((previous) => !previous);
  const toggleAccountMenu = () => {
    if (authLoading) return;
    setIsAccountMenuOpen((previous) => !previous);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setIsAccountMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      {/* Navbar height + mobile layout adjustments */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-white">
        <Link href="/" className="group flex items-center gap-3">
            <model-viewer
              src="/logo-3d.glb"
              loading="lazy"
              camera-controls
              auto-rotate
              rotation-per-second="120deg"
              disable-zoom
              shadow-intensity="1"
              className="h-14 w-14"
              aria-label="Fish Your Style 3D logo"
            />
            <div className="leading-tight">
              <p className="text-base font-semibold text-white">Fish Your Style</p>
              <span className="text-xs text-sky-100">Sea streetwear</span>
            </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-2 text-sm font-medium text-sky-100 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeAllMenus}
                className={`rounded-full px-4 py-2 transition-colors duration-200 ${
                  active
                    ? "bg-white/20 text-white shadow-inner shadow-white/10"
                    : "hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile icon ordering tweak: cart → account → menu (aligned together) */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Link
            href="/wishlist"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
              pathname.startsWith("/wishlist")
                ? "border-rose-300/60 bg-rose-500/20 text-rose-100"
                : "border-white/25 bg-white/10 text-white"
            } shadow-sm shadow-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
            aria-label="Wishlist"
          >
            <HeartIcon filled={pathname.startsWith("/wishlist")} />
          </Link>
          <motion.button
            type="button"
            onClick={toggleDrawer}
            animate={{
              scale: isBumping ? 1.08 : 1,
              rotate: isBumping ? "-2deg" : "0deg",
            }}
            whileTap={{ scale: 0.95 }}
            data-cart-target="true"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white shadow-sm shadow-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Cart"
          >
            <CartIcon />
            {totalQuantity > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[22px] rounded-full bg-white px-2 py-0.5 text-center text-[11px] font-semibold text-slate-900 shadow-md shadow-black/25">
                {totalQuantity}
              </span>
            )}
            <span className="sr-only">Cart drawer</span>
          </motion.button>
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={toggleAccountMenu}
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold text-white shadow-sm shadow-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Account"
              disabled={authLoading}
            >
              <AccountIcon />
              <span className="sr-only">Account menu</span>
            </button>
            <AnimatePresence>
              {isAccountMenuOpen && !authLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/20 bg-slate-900/80 text-sm text-sky-50 shadow-xl shadow-black/30 backdrop-blur"
                  role="menu"
                >
                  {user ? (
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-sky-100">
                        <span className="font-semibold">
                          {user.email ?? "My account"}
                        </span>
                      </div>
                      <div className="my-3 h-px bg-white/10" aria-hidden />
                      <div className="flex flex-col gap-1">
                        <Link
                          href="/account"
                          className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/10"
                          role="menuitem"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          My account
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/10"
                          role="menuitem"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          My orders
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/10"
                          role="menuitem"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          My wishlist
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                          role="menuitem"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="mb-2 text-xs uppercase tracking-wide text-sky-200/70">Welcome</p>
                      <Link
                        href="/account"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
                        role="menuitem"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Sign in / Create account
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white shadow-sm shadow-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-4 text-sm font-medium text-white md:hidden"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 shadow-lg shadow-black/30 backdrop-blur">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeAllMenus}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-sky-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {link.label}
                    {active && <span className="text-xs text-sky-200">●</span>}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <CartDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </header>
  );
}

export default Navbar;
