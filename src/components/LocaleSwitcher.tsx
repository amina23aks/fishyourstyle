"use client";

import { usePathname, useRouter } from "next/navigation";
import { defaultLocale, locales, isLocale, type Locale } from "@/i18n/config";

const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : defaultLocale;
}

function buildLocalePathname(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.length > 0 ? segments.slice(1).join("/") : "";
  return rest ? `/${nextLocale}/${rest}` : `/${nextLocale}`;
}

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const currentLocale = getLocaleFromPathname(pathname);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-sky-100">Language</span>
      <div className="flex flex-wrap gap-2">
        {locales.map((locale) => {
          const isActive = locale === currentLocale;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => router.push(buildLocalePathname(pathname, locale))}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                isActive
                  ? "bg-white text-slate-900"
                  : "border border-white/15 bg-white/5 text-sky-100 hover:bg-white/10"
              }`}
              aria-pressed={isActive}
            >
              {localeLabels[locale]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
