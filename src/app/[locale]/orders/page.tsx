import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersList from "@/components/OrdersList";
import PageShell from "@/components/PageShell";
import { getMessages } from "@/i18n/get-messages";
import { createTranslator } from "@/i18n/translator";
import { resolveLocale } from "@/i18n/config";
import { buildAlternateLanguages, buildLocalizedUrl, defaultOgImageUrl } from "@/lib/seo";

const metadataContent = {
  title: "Orders | Fish Your Style",
  description: "Track your deliveries and review the details of orders placed through Fish Your Style.",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const url = buildLocalizedUrl(locale, "/orders");
  const ogImages = [defaultOgImageUrl];

  return {
    ...metadataContent,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages("/orders"),
    },
    openGraph: {
      ...metadataContent,
      url,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      ...metadataContent,
      images: ogImages,
    },
  };
}

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const messages = await getMessages(locale);
  const t = createTranslator(messages);
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl space-y-6 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-sky-50">{t("orders.title")}</h1>
          <p className="text-sky-100/80">
            {t("orders.subtitle")}
          </p>
        </header>

        <Suspense fallback={<div className="rounded-2xl bg-white/5 p-6 text-sky-100">{t("orders.loading")}</div>}>
          <OrdersList />
        </Suspense>
      </section>
    </PageShell>
  );
}
