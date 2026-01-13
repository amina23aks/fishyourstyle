"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  | "confirmOrder";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

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
    confirmOrder: "Confirm your order",
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
    confirmOrder: "Confirmez votre commande",
  },
  ar: {
    home: "الرئيسية",
    shop: "المتجر",
    contact: "تواصل",
    orders: "الطلبات",
    signIn: "تسجيل الدخول",
    myProfile: "ملفي",
    myOrders: "طلباتي",
    signOut: "تسجيل الخروج",
    preferences: "التفضيلات",
    language: "اللغة",
    theme: "المظهر",
    light: "فاتح",
    auroraDark: "شفق داكن",
    checkout: "إتمام الشراء",
    confirmOrder: "تأكيد الطلب",
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "fys-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr" || stored === "ar") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", dir);
    document.body.setAttribute("dir", dir);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage,
      t: (key) => translations[language][key],
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
