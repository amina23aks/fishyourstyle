import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import dynamic from "next/dynamic";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getMessages } from "@/i18n/get-messages";
import { getLocaleDirection, resolveLocale } from "@/i18n/config";

const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), { ssr: false });
const CookiesBanner = dynamic(() => import("@/components/CookiesBanner"), { ssr: false });
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const messages = await getMessages(locale);
  const direction = getLocaleDirection(locale);
  

  return (
    <I18nProvider locale={locale} messages={messages}>
      <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden pt-20" lang={locale} dir={direction}>
        <div dir="ltr" className="text-left">
          <Navbar />
        </div>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CustomCursor />
      <CookiesBanner />
      <AuthModal />
    </I18nProvider>
  );
}
