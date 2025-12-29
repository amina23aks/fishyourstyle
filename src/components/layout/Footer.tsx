"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/fish.your.style",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="3" width="18" height="18" rx="6" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@fish.your.style",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 4v9.2a3.8 3.8 0 1 1-3.8-3.8" />
        <path d="M12 6.2c1.1 1.4 2.8 2.3 4.8 2.5" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1ZqeHDn2q9/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="currentColor"
      >
        <path d="M14.5 8.5h2.1V6.1c0-1.1-.9-2-2-2h-2.2c-1.6 0-2.9 1.3-2.9 2.9v1.5H7.4v2.7h2.1v7.1h2.9v-7.1h2.3l.4-2.7h-2.7V7.3c0-.5.4-.9.9-.9Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const [wishlistEmail, setWishlistEmail] = useState("");
  const [wishlistStatus, setWishlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const handleWishlistSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWishlistStatus("loading");
    setWishlistError(null);

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: wishlistEmail.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to join wishlist.");
      }

      setWishlistStatus("success");
      setWishlistEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join wishlist.";
      setWishlistError(message);
      setWishlistStatus("error");
    }
  };

  return (
    <footer className="mt-16 border-t border-white/10 text-sky-50 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-sm uppercase tracking-[0.28em] text-sky-200">
            Fish Your Style
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Ocean-ready streetwear made for everyday adventures.
          </h2>
          <p className="text-sky-200">
            Discover limited drops, bold colors, and comfy fits crafted for the
            sea-loving community. From the latest collection to custom pieces,
            Fish Your Style keeps your look fresh and effortless.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Navigate</h3>
            <ul className="space-y-2 text-sky-200">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white">
                  My account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="space-y-2 text-sky-200">
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white">
                  Shipping &amp; returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Follow</h3>
            <div className="flex gap-3 text-sky-200">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  aria-label={link.name}
                  className="rounded-full border border-white/10 bg-white/5 p-2 shadow-sm shadow-sky-950/40 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Wishlist</h3>
            <p className="text-sky-200">
              Drop your email to be the first to know when new drops hit your
              wishlist.
            </p>
            <form className="space-y-2" onSubmit={handleWishlistSubmit}>
              <label className="sr-only" htmlFor="wishlist-email">
                Email address
              </label>
              <input
                id="wishlist-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={wishlistEmail}
                onChange={(event) => setWishlistEmail(event.target.value)}
                className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-sky-200 focus:border-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={wishlistStatus === "loading"}
                className="w-full rounded-md bg-gradient-to-r from-sky-400 to-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {wishlistStatus === "loading" ? "Submitting..." : "Join wishlist"}
              </button>
              {wishlistStatus === "success" && (
                <p className="text-[11px] text-emerald-100">Thanks! You&apos;re on the list.</p>
              )}
              {wishlistError && (
                <p className="text-[11px] text-rose-200">{wishlistError}</p>
              )}
            </form>
          </div>
        </div>
      </div>
      <div className="border-t border-sky-800 bg-sky-900/20 py-4 text-center text-xs text-sky-200">
        Copyright © {currentYear} Fish Your Style. All rights reserved.
      </div>
    </footer>
  );
}
