import Link from "next/link";

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
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 px-4 pb-10 text-slate-100">
      <div className="mx-auto max-w-6xl rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-6 py-10 shadow-2xl shadow-slate-900/40">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-wide">Fish Your Style</p>
            <p className="text-sm text-slate-300">
              Copyright © {currentYear} Fish Your Style. All rights reserved.
            </p>
          </div>

          <nav className="flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:gap-6">
            <Link className="transition hover:text-white" href="/privacy-policy">
              Privacy Policy
            </Link>
            <Link className="transition hover:text-white" href="/terms">
              Terms &amp; Conditions
            </Link>
            <Link className="transition hover:text-white" href="/contact">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-label={link.name}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                {link.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
