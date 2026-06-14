import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import FAQAccordion from "@/components/FAQAccordion";
import { faqItems } from "@/data/faqItems";
import { localizePathname } from "@/i18n/paths";
import { resolveLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { createTranslator } from "@/i18n/translator";
import {
  buildAlternateLanguages,
  buildLocalizedUrl,
  brandLogoUrl,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getDefaultSocialImages,
  siteName,
  siteUrl,
} from "@/lib/seo";

export const revalidate = 300;

const homeMetadataByLocale: Record<
  Locale,
  { title: string; description: string }
> = {
  en: {
    title: "Fish Your Style — FLOW DROP 01",
    description:
      "Discover FLOW — DROP 01, the first Fish Your Style chapter inspired by finding your own rhythm.",
  },
  fr: {
    title: "Fish Your Style — FLOW DROP 01",
    description:
      "Découvrez FLOW — DROP 01, le premier chapitre Fish Your Style inspiré par votre propre rythme.",
  },
  ar: {
    title: "Fish Your Style — FLOW DROP 01",
    description:
      "اكتشف FLOW — DROP 01، الفصل الأول من Fish Your Style لإيجاد إيقاعك الخاص.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { title, description } = homeMetadataByLocale[locale];
  const url = buildLocalizedUrl(locale, "/");
  const ogImages = getDefaultSocialImages();

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildAlternateLanguages("/"),
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName,
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}

const flowDropCards = [
  {
    title: "Find Your Flow",
    tone: "from-sky-300/30 via-cyan-200/10 to-slate-950",
    accent: "Rhythm",
  },
  {
    title: "Not Lost. Exploring.",
    tone: "from-blue-500/30 via-slate-900 to-stone-300/20",
    accent: "Explore",
  },
  {
    title: "The Ocean Never Rushes.",
    tone: "from-slate-950 via-blue-950 to-teal-300/20",
    accent: "Patience",
  },
  {
    title: "Not Behind. Just On My Way.",
    tone: "from-amber-200/30 via-slate-900 to-sky-700/20",
    accent: "Purpose",
  },
];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const messages = await getMessages(locale);
  const t = createTranslator(messages);

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: brandLogoUrl,
  };
  const reasons = [
    {
      title: t("whyUs.deliveryTitle"),
      description: t("whyUs.deliveryDescription"),
      icon: "/delivery.gif",
    },
    {
      title: t("whyUs.qualityTitle"),
      description: t("whyUs.qualityDescription"),
      icon: "/quality.gif",
    },
    {
      title: t("whyUs.orderingTitle"),
      description: t("whyUs.orderingDescription"),
      icon: "/order.gif",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />
      <div dir="ltr" className="text-left">
        <Hero />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-12 sm:px-6 lg:px-8">
        <section
          id="flow-drop-01"
          className="overflow-hidden rounded-[2rem] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_34%),linear-gradient(135deg,rgba(8,47,73,0.96),rgba(15,23,42,0.98)_48%,rgba(120,113,108,0.32))] px-5 py-16 text-white shadow-[0_24px_70px_rgba(2,6,23,0.55)] sm:px-8 md:py-20 lg:px-12"
        >
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="max-w-xl space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100/85">
                Find Your Flow.
              </p>
              <div className="space-y-4">
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  FLOW — DROP 01
                </h2>
                <p className="max-w-lg text-base leading-8 text-sky-50/[0.82] sm:text-lg">
                  The first chapter of Fish Your Style. A collection inspired by
                  finding your own rhythm.
                </p>
              </div>
              <Link
                href={localizePathname(locale, "/shop")}
                className="inline-flex items-center justify-center rounded-full bg-stone-100 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 shadow-[0_12px_30px_rgba(14,165,233,0.22)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Discover FLOW
                <span className="ml-2" aria-hidden>
                  →
                </span>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {flowDropCards.map((card, index) => (
                <article
                  key={card.title}
                  className="group relative min-h-64 overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.35)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/35 hover:bg-white/[0.12]"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.tone}`}
                  />
                  <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  <div className="relative flex h-full flex-col justify-between gap-12">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                      <span>{card.accent}</span>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="space-y-4">
                      <div className="h-24 rounded-[2rem] border border-white/15 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] shadow-inner shadow-white/10" />
                      <h3 className="text-2xl font-semibold leading-tight text-white">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8 rounded-3xl bg-sky-900/90 px-6 py-14 text-sky-50 shadow-lg shadow-sky-200/60 md:px-10">
          <div className="flex flex-col gap-3">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-200">
              {t("whyUs.eyebrow")}
            </p>
            <h2 className="text-2xl font-semibold">{t("whyUs.title")}</h2>
            <p className="text-sky-100">{t("whyUs.subtitle")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="group flex h-full flex-col items-center rounded-3xl border border-white/20 bg-white/15 p-7 text-center shadow-[0_12px_30px_rgba(15,23,42,0.45)] backdrop-blur transition hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-[0_16px_40px_rgba(56,189,248,0.35)]"
              >
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/30 bg-white/10 shadow-inner shadow-sky-950/40">
                  <Image
                    src={reason.icon}
                    alt={reason.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {reason.title}
                </h3>
                <p className="mt-3 text-sm text-sky-100/90">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-200/40 to-transparent" />
          <section
            id="faq"
            className="rounded-3xl border border-white/15 bg-sky-950/40 px-6 py-12 text-sky-50 shadow-[0_12px_30px_rgba(15,23,42,0.45)] backdrop-blur md:px-10"
          >
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200">
                FAQ
              </p>
              <h3 className="text-xl font-semibold text-white">أسئلة متكررة</h3>
              <p className="text-sm text-sky-100">
                إجابات مختصرة لأكثر الأسئلة شيوعًا.
              </p>
            </div>
            <div className="mt-6">
              <FAQAccordion items={faqItems} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
