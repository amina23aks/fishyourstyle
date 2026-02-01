import { locales, type Locale } from "@/i18n/config";
import { localizePathname } from "@/i18n/paths";

export const siteUrl = "https://fishyourstyle.vercel.app";
export const metadataBase = new URL("https://fishyourstyle.vercel.app");

export function buildLocalizedUrl(locale: Locale, pathname: string): string {
  return new URL(localizePathname(locale, pathname), metadataBase).toString();
}

export function buildAlternateLanguages(pathname: string): Record<string, string> {
  return Object.fromEntries(locales.map((locale) => [locale, buildLocalizedUrl(locale, pathname)]));
}

export function resolveOgImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const normalized = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return new URL(normalized, metadataBase).toString();
}
