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
    <header className="sticky top-0 z-50 w-full border-b border-sky-100/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-3 text-sky-900">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-lg font-extrabold text-white shadow-lg shadow-sky-200">
            F
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-[0.22em] text-sky-700">
              Fish Your Style
            </span>
            <span className="text-lg font-semibold text-slate-900">
              Sea-Inspired Wear
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 transition-colors duration-200 ${
                  active
                    ? "bg-sky-100 text-sky-900"
                    : "hover:bg-sky-50 hover:text-sky-900"
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
            className="rounded-full border border-sky-100 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm shadow-sky-100 transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sky-200"
          >
            Account
          </Link>
          <Link
            href="/cart"
            className="rounded-full bg-gradient-to-r from-sky-500 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:translate-y-[-2px]"
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
