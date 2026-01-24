"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { Locale } from "./config";
import { getLocaleDirection } from "./config";
import type { Messages } from "./get-messages";
import { createTranslator } from "./translator";

export type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const t = useMemo(() => createTranslator(messages), [messages]);
  const direction = useMemo(() => getLocaleDirection(locale), [locale]);
  const value = useMemo(() => ({ locale, messages, t }), [locale, messages, t]);

  useEffect(() => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + thirtyDaysInMs;
    const localePayload = JSON.stringify({ value: locale, expiresAt });
    const directionPayload = JSON.stringify({ value: direction, expiresAt });

    window.localStorage.setItem("preferredLocale", localePayload);
    window.localStorage.setItem("preferredDirection", directionPayload);
  }, [direction, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslations must be used within an I18nProvider");
  }
  return context.t;
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useLocale must be used within an I18nProvider");
  }
  return context.locale;
}
