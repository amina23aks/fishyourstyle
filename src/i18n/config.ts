export const locales = ["en", "fr", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  fr: "ltr",
  ar: "rtl",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value) && locales.includes(value as Locale);
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getLocaleDirection(locale: Locale): "ltr" | "rtl" {
  return localeDirections[locale] ?? "ltr";
}
