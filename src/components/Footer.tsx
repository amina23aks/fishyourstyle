"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function Footer() {
  const [wishlistEmail, setWishlistEmail] = useState("");
  const [wishlistStatus, setWishlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [wishlistError, setWishlistError] = useState<string | null>(null);

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
            Sea-inspired streetwear for explorers.
          </h2>
          <p className="text-sky-200">
            Built with Next.js, Tailwind, and a splash of ocean magic. More
            sections are coming as we wire up products, cart, and admin.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Navigate</h3>
            <ul className="space-y-2 text-sky-200">
              <li>
                <Link href="/shop" className="hover:text-white">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/custom" className="hover:text-white">
                  Custom orders
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
                <Link href="/shipping" className="hover:text-white">
                  Shipping & returns
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
              <Link
                href="https://www.instagram.com"
                aria-label="Instagram"
                className="rounded-full border border-white/10 bg-white/5 p-2 transition hover:border-white/30 hover:bg-white/1"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="17.2" cy="6.8" r="0.9" />
                </svg>
              </Link>
              <Link
                href="https://www.tiktok.com"
                aria-label="TikTok"
                className="rounded-full border border-white/10 bg-white/5 p-2 transition hover:border-white/30 hover:bg-white/1"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M14 4.5v9a3.5 3.5 0 1 1-3.5-3.5h.5" />
                  <path d="M14 7.5c.9.9 2.5 2 4 2" />
                </svg>
              </Link>
              <Link
                href="https://www.facebook.com"
                aria-label="Facebook"
                className="rounded-full border border-white/10 bg-white/5 p-2 transition hover:border-white/30 hover:bg-white/1"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M14 10h2V7h-2c-1.1 0-2 .9-2 2v2H10v3h2v4h3v-4h2.1l.4-3H15V9.5c0-.3.2-.5.5-.5Z" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Wishlist </h3>
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
                placeholder="you@example.commimimi"
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
        © 2024 Fish Your Style — Crafted for the ocean-loving community.
      </div>
    </footer>
  );
}
