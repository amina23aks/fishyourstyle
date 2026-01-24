import { redirect } from "next/navigation";
import { localizePathname } from "@/i18n/paths";
import { resolveLocale } from "@/i18n/config";

export default async function WishlistRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  redirect(localizePathname(locale, "/favorites"));
}
