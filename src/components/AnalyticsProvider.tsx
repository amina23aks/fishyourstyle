"use client";

import { useEffect, useMemo, useState } from "react";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

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
  const [isReady, setIsReady] = useState(false);

  const pagePath = useMemo(() => {
    if (!pathname || !searchParams) return "";
    return getPagePath(pathname, searchParams);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!measurementId) return;

    const initializeGtag = () => {
      if (window.gtag) {
        setIsReady(true);
        return;
      }

      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => {
        window.dataLayer?.push(args);
      };

      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false });

      const scriptId = `ga-gtag-${measurementId}`;
      if (document.getElementById(scriptId)) {
        setIsReady(true);
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.onload = () => setIsReady(true);
      document.head.appendChild(script);
    };

    const consent = window.localStorage.getItem(CONSENT_KEY);
    if (consent === "accepted") {
      initializeGtag();
    }

    const handleConsent = () => {
      initializeGtag();
    };

    window.addEventListener(CONSENT_EVENT, handleConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, handleConsent);
    };
  }, [measurementId]);

  useEffect(() => {
    if (!measurementId || !isReady || !pagePath) return;
    window.gtag?.("config", measurementId, { page_path: pagePath });
  }, [measurementId, isReady, pagePath]);

  return children;
}
