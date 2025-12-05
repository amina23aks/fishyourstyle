"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function Navbar() {
  const pathname = usePathname();
  const { totalQuantity, lastAddedAt } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!lastAddedAt) return;
    setIsBumping(true);
    const timer = window.setTimeout(() => setIsBumping(false), 450);
    return () => window.clearTimeout(timer);
  }, [lastAddedAt]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const toggleDrawer = () => setIsDrawerOpen((previous) => !previous);
  const toggleMenu = () => setIsMenuOpen((previous) => !previous);

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
          <Link
            href="/account"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold text-white shadow-sm shadow-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Account"
          >
            <AccountIcon />
            <span className="sr-only">Account</span>
          </Link>
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
