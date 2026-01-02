"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { trackPageView } from "@/lib/analytics";

const CONSENT_KEY = "fishyourstyle_cookie_consent_v1";
const CONSENT_EVENT = "fishyourstyle:cookie-consent-accepted";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

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

  const pagePath = useMemo(() => {
    if (!pathname || !searchParams) return "";
    return getPagePath(pathname, searchParams);
  }, [pathname, searchParams]);

  useEffect(() => {
    const consent = window.localStorage.getItem(CONSENT_KEY);
    if (consent === "accepted") {
      setHasConsent(true);
    }

    const handleConsent = () => {
      window.localStorage.setItem(CONSENT_KEY, "accepted");
      setHasConsent(true);
    };

    window.addEventListener(CONSENT_EVENT, handleConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, handleConsent);
    };
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
          window.gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
      {children}
    </>
  );
}
