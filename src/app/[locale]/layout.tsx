import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer";
import CookiesBanner from "@/components/CookiesBanner";
import AuthModal from "@/components/AuthModal";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getMessages } from "@/i18n/get-messages";
import { resolveLocale } from "@/i18n/config";

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

  return (
    <I18nProvider locale={locale} messages={messages}>
      <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden pt-20">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CookiesBanner />
      <AuthModal />
    </I18nProvider>
  );
}
