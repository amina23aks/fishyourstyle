"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (

    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-white">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-inner shadow-white/20">
            <model-viewer
              src="/logo-3d.glb"
              loading="lazy"
              auto-rotate
              camera-controls
              disable-zoom
              shadow-intensity="1"
              className="h-20 w-20"
              aria-label="Fish Your Style 3D logo"
            />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold text-white">Fish Your Style</p>
            <span className="text-xs text-sky-100">Sea streetwear</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-medium text-sky-100 md:flex">
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

        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white shadow-sm shadow-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
            aria-label="Account"
          >
            <AccountIcon />
            <span className="sr-only">Account</span>
          </Link>
          <Link
            href="/cart"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:translate-y-[-2px]"
            aria-label="Cart"
          >
            <CartIcon />
            <span className="sr-only">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
