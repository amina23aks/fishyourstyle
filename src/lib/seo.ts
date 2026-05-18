import type { Metadata } from "next";

import { locales, type Locale } from "@/i18n/config";
import { localizePathname } from "@/i18n/paths";

export const siteName = "Fish Your Style";
export const siteUrl = "https://fishyourstyle.vercel.app";
export const metadataBase = new URL(siteUrl);
export const defaultOgImagePath = "/outphoto.png";
export const defaultOgImageUrl = new URL(defaultOgImagePath, metadataBase).toString();
export const defaultSocialImageUrl = defaultOgImageUrl;
export const brandLogoPath = "/logoF.png";
export const brandLogoUrl = new URL(brandLogoPath, metadataBase).toString();

export const privateRobots = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} satisfies Metadata["robots"];

export const localeOpenGraphMap: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_DZ",
};

export function getOpenGraphLocale(locale: Locale): string {
  return localeOpenGraphMap[locale];
}

export function getAlternateOpenGraphLocales(locale: Locale): string[] {
  return locales.filter((candidate) => candidate !== locale).map((candidate) => localeOpenGraphMap[candidate]);
}

export function buildLocalizedUrl(locale: Locale, pathname: string): string {
  return new URL(localizePathname(locale, pathname), metadataBase).toString();
}

export function buildAlternateLanguages(pathname: string): Record<string, string> {
  const languages = Object.fromEntries(locales.map((locale) => [locale, buildLocalizedUrl(locale, pathname)]));

  return {
    ...languages,
    "x-default": buildLocalizedUrl("en", pathname),
  };
}

export function resolveOgImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const normalized = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return new URL(normalized, metadataBase).toString();
}

export function getDefaultSocialImages(): string[] {
  return [defaultSocialImageUrl];
}
