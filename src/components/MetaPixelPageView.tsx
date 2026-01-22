"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/metaPixel";

export default function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasTrackedInitialRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (!hasTrackedInitialRef.current) {
      hasTrackedInitialRef.current = true;
      return;
    }

    // Meta Pixel page view on client-side route change.
    pageview();
  }, [pathname, searchParams]);

  return null;
}
