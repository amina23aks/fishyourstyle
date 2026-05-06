import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/config";
import { buildAlternateLanguages, buildLocalizedUrl } from "@/lib/seo";

import AdminBootstrapClient from "./AdminBootstrapClient";

const metadataContent = {
  title: "Temporary Admin Bootstrap | Fish Your Style",
  description: "Temporary developer-only helper for bootstrapping the first Firebase admin claim.",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return {
    ...metadataContent,
    robots: { index: false, follow: false },
    alternates: {
      canonical: buildLocalizedUrl(locale, "/admin-bootstrap"),
      languages: buildAlternateLanguages("/admin-bootstrap"),
    },
  };
}

export default function AdminBootstrapPage() {
  return <AdminBootstrapClient />;
}
