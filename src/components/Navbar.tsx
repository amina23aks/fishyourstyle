"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-white">
        <Link href="/" className="group flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400/80 to-blue-700/80 text-lg font-extrabold text-white shadow-lg shadow-sky-900/40">
            F
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-[0.22em] text-sky-100/80">
              Fish Your Style
            </span>
            <span className="text-lg font-semibold text-white">
              Sea-Inspired Wear
            </span>
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
             className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Account
          </Link>
          <Link
            href="/cart"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:translate-y-[-2px]">
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
