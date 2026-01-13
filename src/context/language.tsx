"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LanguageCode = "en" | "fr" | "ar";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: keyof typeof translations["en"]) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_STORAGE_KEY = "fys-language";

const translations = {
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
    dark: "Dark",
    heroTitle: "Fish Your Style. Catch What You Love.",
    heroSubtitle:
      "Streetwear made for every style, every mood, and every moment. From everyday essentials to statement pieces — your style starts here.",
    shopNow: "Shop Now",
    checkout: "Checkout",
    confirmOrder: "Confirm your order",
    profileHeading: "My Profile",
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
    dark: "Sombre",
    heroTitle: "Fish Your Style. Choisis ce que tu aimes.",
    heroSubtitle:
      "Streetwear pour chaque style, chaque humeur et chaque moment. Des essentiels du quotidien aux pièces fortes — ton style commence ici.",
    shopNow: "Acheter",
    checkout: "Paiement",
    confirmOrder: "Confirmez votre commande",
    profileHeading: "Mon profil",
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
    dark: "داكن",
    heroTitle: "Fish Your Style. اختر ما تحب.",
    heroSubtitle:
      "ملابس شارع لكل أسلوب وكل مزاج وكل لحظة. من الأساسيات اليومية إلى القطع المميزة — أسلوبك يبدأ هنا.",
    shopNow: "تسوّق الآن",
    checkout: "الدفع",
    confirmOrder: "تأكيد الطلب",
    profileHeading: "ملفي",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "fr" || stored === "ar") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof typeof translations["en"]) => translations[language][key] ?? translations.en[key],
    }),
    [language]
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
