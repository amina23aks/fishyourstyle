"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { isDebugMode, trackPageView } from "@/lib/analytics";
import { hasAnalyticsConsent, onConsentGranted } from "@/lib/consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

/**
 * README: Append ?debug_mode=true to any URL to enable GA4 DebugView
 * (all events/config include debug_mode=true). Analytics events are sent
 * only after cookie consent is accepted (fishyourstyle_cookie_consent_v1).
 */
function getPagePath(pathname: string, searchParams: ReadonlyURLSearchParams) {
  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [isGtagReady, setIsGtagReady] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const debugMode = isDebugMode();

  const pagePath = useMemo(() => {
    if (!pathname || !searchParams) return "";
    return getPagePath(pathname, searchParams);
  }, [pathname, searchParams]);

  useEffect(() => {
    setHasConsent(hasAnalyticsConsent());
    return onConsentGranted(() => {
      setHasConsent(hasAnalyticsConsent());
    });
  }, []);

  useEffect(() => {
    if (!hasConsent || !isGtagReady) return;
    window.gtag?.("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
    });
  }, [hasConsent, isGtagReady]);

  useEffect(() => {
    if (!measurementId || !isGtagReady || !hasConsent || !pagePath) return;
    trackPageView(pagePath);
  }, [measurementId, isGtagReady, hasConsent, pagePath]);

  return (
    <>
      <Script
        id="ga-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => setIsGtagReady(true)}
      />
      <Script id="ga-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);}
          window.gtag('consent','default',{ad_storage:'denied', analytics_storage:'denied'});
          window.gtag('js', new Date());
          window.gtag('config', '${measurementId}', { send_page_view: false, debug_mode: ${debugMode ? "true" : "false"} });
        `}
      </Script>
      {children}
    </>
  );
}
