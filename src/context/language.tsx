"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "fr" | "ar";

type TranslationKey =
  | "home"
  | "shop"
  | "contact"
  | "orders"
  | "signIn"
  | "myProfile"
  | "myOrders"
  | "signOut"
  | "preferences"
  | "language"
  | "theme"
  | "light"
  | "auroraDark"
  | "checkout"
  | "orderSummary";

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: (key: TranslationKey) => string;
};

const STORAGE_KEY = "fys-language";

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    home: "Home",
    shop: "Shop",
    contact: "Contact",
    orders: "Orders",
    signIn: "Sign in",
    myProfile: "My Profile",
    myOrders: "My orders",
    signOut: "Sign out",
    preferences: "Preferences",
    language: "Language",
    theme: "Theme",
    light: "Light",
    auroraDark: "Aurora Dark",
    checkout: "Checkout",
    orderSummary: "Order summary",
  },
  fr: {
    home: "Accueil",
    shop: "Boutique",
    contact: "Contact",
    orders: "Commandes",
    signIn: "Se connecter",
    myProfile: "Mon profil",
    myOrders: "Mes commandes",
    signOut: "Se déconnecter",
    preferences: "Préférences",
    language: "Langue",
    theme: "Thème",
    light: "Clair",
    auroraDark: "Aurore sombre",
    checkout: "Paiement",
    orderSummary: "Récapitulatif",
  },
  ar: {
    home: "الرئيسية",
    shop: "المتجر",
    contact: "تواصل معنا",
    orders: "الطلبات",
    signIn: "تسجيل الدخول",
    myProfile: "ملفي الشخصي",
    myOrders: "طلباتي",
    signOut: "تسجيل الخروج",
    preferences: "التفضيلات",
    language: "اللغة",
    theme: "السمة",
    light: "فاتح",
    auroraDark: "شفق داكن",
    checkout: "الدفع",
    orderSummary: "ملخص الطلب",
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr" || stored === "ar") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.setAttribute("dir", dir);
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: Language) => setLanguageState(next),
      t: (key: TranslationKey) => translations[language][key],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
