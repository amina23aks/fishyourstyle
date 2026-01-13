"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "fr" | "ar";

type TranslationKey =
  | "nav.home"
  | "nav.shop"
  | "nav.contact"
  | "nav.orders"
  | "menu.signIn"
  | "menu.myProfile"
  | "menu.myOrders"
  | "menu.signOut"
  | "menu.preferences"
  | "menu.language"
  | "menu.theme"
  | "menu.light"
  | "menu.auroraDark"
  | "home.heading"
  | "checkout.heading";

type Translations = Record<Language, Record<TranslationKey, string>>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const translations: Translations = {
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.contact": "Contact",
    "nav.orders": "Orders",
    "menu.signIn": "Sign in",
    "menu.myProfile": "My Profile",
    "menu.myOrders": "My orders",
    "menu.signOut": "Sign out",
    "menu.preferences": "Preferences",
    "menu.language": "Language",
    "menu.theme": "Theme",
    "menu.light": "Light",
    "menu.auroraDark": "Aurora Dark",
    "home.heading": "Fish Your Style. Catch What You Love.",
    "checkout.heading": "Confirm your order",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.shop": "Boutique",
    "nav.contact": "Contact",
    "nav.orders": "Commandes",
    "menu.signIn": "Se connecter",
    "menu.myProfile": "Mon profil",
    "menu.myOrders": "Mes commandes",
    "menu.signOut": "Se déconnecter",
    "menu.preferences": "Préférences",
    "menu.language": "Langue",
    "menu.theme": "Thème",
    "menu.light": "Clair",
    "menu.auroraDark": "Aurora Dark",
    "home.heading": "Fish Your Style. Choisissez ce que vous aimez.",
    "checkout.heading": "Confirmez votre commande",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.shop": "المتجر",
    "nav.contact": "تواصل",
    "nav.orders": "الطلبات",
    "menu.signIn": "تسجيل الدخول",
    "menu.myProfile": "ملفي",
    "menu.myOrders": "طلباتي",
    "menu.signOut": "تسجيل الخروج",
    "menu.preferences": "التفضيلات",
    "menu.language": "اللغة",
    "menu.theme": "المظهر",
    "menu.light": "فاتح",
    "menu.auroraDark": "Aurora Dark",
    "home.heading": "Fish Your Style. اختر ما تحب.",
    "checkout.heading": "تأكيد الطلب",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "fys-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && ["en", "fr", "ar"].includes(stored)) {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = useCallback(
    (key: TranslationKey) => {
      const entry = translations[language][key];
      return entry ?? translations.en[key] ?? key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { Language, TranslationKey };
