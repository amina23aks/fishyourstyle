import type { Locale } from "./config";
import { locales, resolveLocale } from "./config";

export function isLocalePath(pathname: string): boolean {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

export function localizePathname(locale: Locale | string, pathname: string): string {
  const resolvedLocale = resolveLocale(locale);
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized === "/") {
    return `/${resolvedLocale}`;
  }
  if (normalized === `/${resolvedLocale}` || normalized.startsWith(`/${resolvedLocale}/`)) {
    return normalized;
  }
  return `/${resolvedLocale}${normalized}`;
}
