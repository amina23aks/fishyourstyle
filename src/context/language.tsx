"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "fr" | "ar";

type TranslationKey =
  | "home"
  | "shop"
  | "contact"
  | "orders"
  | "signIn"
  | "signOut"
  | "myProfile"
  | "myOrders"
  | "preferences"
  | "language"
  | "theme"
  | "light"
  | "auroraDark"
  | "heroTitle"
  | "checkout";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "fys-language";

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    home: "Home",
    shop: "Shop",
    contact: "Contact",
    orders: "Orders",
    signIn: "Sign in",
    signOut: "Sign out",
    myProfile: "My Profile",
    myOrders: "My orders",
    preferences: "Preferences",
    language: "Language",
    theme: "Theme",
    light: "Light",
    auroraDark: "Aurora Dark",
    heroTitle: "Fish Your Style. Catch What You Love.",
    checkout: "Checkout",
  },
  fr: {
    home: "Accueil",
    shop: "Boutique",
    contact: "Contact",
    orders: "Commandes",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    myProfile: "Mon profil",
    myOrders: "Mes commandes",
    preferences: "Préférences",
    language: "Langue",
    theme: "Thème",
    light: "Clair",
    auroraDark: "Aurora Dark",
    heroTitle: "Fish Your Style. Attrape ce que tu aimes.",
    checkout: "Paiement",
  },
  ar: {
    home: "الرئيسية",
    shop: "المتجر",
    contact: "تواصل",
    orders: "الطلبات",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    myProfile: "حسابي",
    myOrders: "طلباتي",
    preferences: "التفضيلات",
    language: "اللغة",
    theme: "السمة",
    light: "فاتح",
    auroraDark: "أورورا داكن",
    heroTitle: "Fish Your Style. التقط ما تحب.",
    checkout: "الدفع",
  },
};

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "ar" || stored === "en") {
    return stored;
  }
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key] ?? key,
    [language],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
